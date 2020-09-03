import React from 'react';
import logo from './logo.svg';
import './App.css';
const DEBUG = 0;
class ZipInput extends React.Component {
  constructor(props) {
    super(props);
    this.state =
        {
          value: '',
          submitted: false,
          results: null,
          name: null,
          UVArr: null,
          beginUV: null,
          beginTime: null,
          endUV: null,
          endTime: null,
          peakUV: null,
          peakTime: null,
          cloudiness: null,
          success: false
        };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.timeConverter = this.timeConverter.bind(this);
  }
  handleChange(event) {
    this.setState({value: event.target.value});
  }
  handleSubmit(event) {
    if (this.state.value == '')
      return;
    event.preventDefault();
    let gKey = process.env.REACT_APP_gKey;
    let UVKey = process.env.REACT_APP_UVKey;
    var localUVArr = null;
    let fetchData = async () => {
      try {
        let response = await (fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${this.state.value}&key=${gKey}`));
        let json = await response.json();
        this.setState({results: [json.results[0].geometry.location.lat, json.results[0].geometry.location.lng]});
        this.setState({name: json.results[0].address_components[1].short_name});
        if (!DEBUG) {
          let response = await fetch(`https://api.openuv.io/api/v1/forecast?lat=${this.state.results[0]}&lng=${this.state.results[1]}`, {headers: {'x-access-token': UVKey}});
          let json = await response.json();
          this.setState({UVArr: json.result})
        }
        localUVArr = this.state.UVArr;
        this.setState({peakUV: localUVArr[0].uv, peakTime: this.timeConverter(localUVArr[0].uv_time)});
        for (var i = 0; i < localUVArr.length; i++) {
          if (localUVArr[i].uv >= 6 && this.state.beginUV == null) {
            this.setState({beginUV: localUVArr[i].uv, beginTime: this.timeConverter(localUVArr[i].uv_time)});
          } else if (localUVArr[i].uv < 6 && this.state.beginUV != null && this.state.endUV == null) {
            this.setState({endUV: localUVArr[i - 1].uv, endTime: this.timeConverter(localUVArr[i - 1].uv_time)});
          }
          if (localUVArr[i].uv > this.state.peakUV) {
            this.setState({peakUV: localUVArr[i].uv, peakTime: this.timeConverter(localUVArr[i].uv_time)});
          }
        }
        this.setState({success: true});
      } catch (err) {
        this.setState({success: false});
        alert("There was an error finding data for this zipcode. The 50 daily request limit may have been reached.");
      }
    };
    fetchData();
    this.setState({submitted: true});

  }
  timeConverter(string) {
    var d = new Date(string);
    console.log(d.getHours() + ':' + d.getMinutes());
    return d;
  }
  render() {
    return (
        <div className={"main-container"}>
          <h1>
            Tanning Planning
          </h1>
          <p1>Enter your zipcode:</p1>
          <div>
            <form onSubmit={this.handleSubmit}>
              <input type='number' value={this.state.value} onChange={this.handleChange}
                     style={{width: "100px", alignSelf: "center", borderRadius: "50px", padding: "7px"}}/>
              <input type='submit' value='Submit'
                     style={{padding: "7px", borderWidth: "1px", borderRadius: "50px", alignSelf: "center"}}/>
            </form>
          </div>
          {this.state.success ? <UVDisplay beginTime={this.state.beginTime}
                                           endTime={this.state.endTime}
                                           peakUV={this.state.peakUV}
                                           peakTime={this.state.peakTime}
          className={"UVDisplay"}/> : null}
        </div>
    )
  }
}
function UVDisplay(props) {
  if (props.beginTime == null) {
    return <div>
      <p>There is no viable time to tan today.</p>
    </div>
  }
  let recommendation = null;
  if (props.peakUV > 8) {
    recommendation = "If you choose to go outside during this timeframe, the sun will reach extreme UV during peak time and you will burn in less than 25 minutes."
  } else {
    recommendation = "If you choose to go outside during this timeframe, the sun will be strong during peak hours and burning will take roughly 30 minutes."
  }
  return <div style={{display: "flex", maxWidth: "90%", textAlign: "center"}}>
    <p style={{padding: "10px"}}>High UV
      Hours: {props.beginTime.getHours() + ':00'} to {props.endTime.getHours() + 1 + ':00'}. <br/>
      Peak UV: {props.peakUV} at {props.peakTime.getHours() + ':' + props.peakTime.getMinutes()}. <br/>
      Tanning outside these hours will be the safest on your skin.
      <p style={{padding: "10px"}}>
        {recommendation}<br/>Limit exposure and seek shade.
      </p>
      <p style={{padding: "10px"}}>
        Always wear sunscreen with SPF 30+ when outside.
      </p>
    </p>

  </div>
}
export default ZipInput;

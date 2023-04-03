import React, { Component } from "react";
import { callRtmApi, getSignedUrl, writeCookie, readCookie } from "./Util.js";

export default class Test extends Component {
  constructor(props) {
    super(props);

    this.state = {
      token: readCookie("token"),
      username: readCookie("username")
    };
  }

  componentWillMount() {
    if (this.state.token === undefined || this.state.username === undefined) {
      this.authenticate();
    }
  }

  authenticate() {
    callRtmApi(getSignedUrl({ "method": "rtm.auth.getFrob" }), (success, data) => {
      if (success) {
        const frob = data["rsp"]["frob"];
        const args = {
          "perms": "read",
          "frob": frob
        };
        window.open(getSignedUrl(args, true), "_blank").focus();
        window.addEventListener("focus", this.authenticateCallback(frob), { once: true });
      }
      else {
        alert(`Authentication error: ${data["rsp"]["err"]["msg"]}`);
      }
    });
  }

  authenticateCallback(frob) {
    window.removeEventListener("focus", this.authenticateCallback);
    const args = {
      "method": "rtm.auth.getToken",
      "frob": frob
    };
    setTimeout(() => { // it takes some time for frob to be recognized as valid on RTM api, so sleep 1 second
      callRtmApi(getSignedUrl(args), (success, data) => {
        if (success) {
          this.setState({
            token: data["rsp"]["auth"]["token"],
            username: data["rsp"]["auth"]["user"]["username"]
          }, () => {
            writeCookie("token", this.state.token);
            writeCookie("username", this.state.username);
          });
        }
        else {
          alert(`Authentication callback error: ${data["rsp"]["err"]["msg"]}`);
        }
      });
    }, 1000);
  };

  render() {
    return(
      <div>
        Test {this.state.username}
      </div>
    );
  }
}
import React, { Component } from "react";
import Tasks from "./Tasks.js";
import { callRtmApi, getSignedUrl, writeCookie, readCookie, setStateHelper } from "./Util.js";

export default class Base extends Component {
  constructor(props) {
    super(props);

    this.state = {
      token: readCookie("token"),
      username: readCookie("username"),
      lists: null,
      selectedListId: null
    };
  }

  componentWillMount() {
    if (this.state.token === undefined || this.state.username === undefined) {
      this.authenticate();
    } else {
      this.checkToken();
    }
  }

  checkToken() {
    const args = {
      "method": "rtm.auth.checkToken",
      "auth_token": this.state.token
    };
    callRtmApi(getSignedUrl(args), (success, data) => {
      if (!success) {
        this.authenticate();
      } else {
        this.loadLists();
      }
    });
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

  loadLists() {
    const args = {
      "method": "rtm.lists.getList",
      "auth_token": this.state.token
    };
    callRtmApi(getSignedUrl(args), (success, data) => {
      if (success) {
        const lists = data["rsp"]["lists"]["list"];
        let selectedListId = lists.length > 0 ? lists[0]["id"] : null;

        // if default list exists, set it as the selected list
        const defaultList = lists.find(list => list["name"] === "default")
        if (defaultList) {
          selectedListId = defaultList["id"];
        }

        this.setState({
          lists: lists,
          selectedListId: selectedListId
        });
      }
      else {
        alert(`Api error: ${data["rsp"]["err"]["msg"]}`);
      }
    });
  }

  render() {
    return(
      <div>
        Base {this.state.username} {this.state.token}
        <br />
        <select disabled={this.state.lists === null} value={this.state.selectedListId} 
          onChange={(event) => setStateHelper(this, "selectedListId", event.target.value)}>

          { this.state.lists !== null && this.state.lists.map((list, index) => 
            <option value={list.id}>{list.name}</option>
          )}
        </select>

        <Tasks token={this.state.token} username={this.state.username} listId={this.state.selectedListId} />
      </div>
    );
  }
}
import React, { Component } from "react";
import { callRtmApi, getSignedUrl, writeCookie, readCookie, downloadData } from "./Util.js";

export default class Test extends Component {
  constructor(props) {
    super(props);

    this.state = {
      token: readCookie("token"),
      username: readCookie("username"),
      data: ""
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

  getLists() {
    const args = {
      "method": "rtm.lists.getList",
      "auth_token": this.state.token
    };
    callRtmApi(getSignedUrl(args), (success, data) => {
      if (success) {
        this.setState({
          data: JSON.stringify(data["rsp"]["lists"]["list"])
        });
      }
      else {
        alert(`Api error: ${data["rsp"]["err"]["msg"]}`);
      }
    });
  }

  downloadTasks(listId, year=null) {
    const args = {
      "method": "rtm.tasks.getList",
      "list_id": listId,
      "auth_token": this.state.token
    };
    if (year !== null) {
      args["filter"] = `status:completed AND completedAfter:${year}-01-01 AND completedBefore:${year}-12-31`;
    }
    callRtmApi(getSignedUrl(args), (success, data) => {
      if (success) {
        // desired output format
        let output = "added,due,completed,name,notes\n";

        // iterate through tasks and remember desired fields
        let taskList = [];
        for (const taskseries of data["rsp"]["tasks"]["list"][0]["taskseries"]) {
          const name = taskseries["name"];
          let notes = [];
          if (taskseries["notes"].length !== 0) {
            taskseries["notes"]["note"].forEach(note => notes.push(note["$t"]));
          }
          for (const task of taskseries["task"]) {
            taskList.push([task["added"], task["due"], task["completed"], name, notes]);
          }
        }

        // sort tasks by added date
        taskList.sort((a, b) => a[0].localeCompare(b[0]));
        for (const task of taskList) {
          for (const field of task) {
            output += `"${field}",`;
          }
          output += "\n";
        }
        
        // download tasks data
        downloadData(output, `${this.state.username}_${listId}_${year === null ? "all" : year}.csv`, "text/csv");
      }
      else {
        alert(`Api error: ${data["rsp"]["err"]["msg"]}`);
      }
    });
  }

  render() {
    return(
      <div>
        Test {this.state.username} {this.state.token}
        <br />
        <button onClick={() => this.downloadTasks("44060505", 2022)}>Click this</button>
        <br />
        <br />
        {this.state.data}
      </div>
    );
  }
}
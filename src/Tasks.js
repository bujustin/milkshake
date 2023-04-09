import React, { Component } from "react";
import Dayz from "dayz";
import moment from "moment";
import { callRtmApi, getSignedUrl, downloadData } from "./Util.js";
import "./dayz.scss";

export default class Tasks extends Component {
  constructor(props) {
    super(props);

    this.state = {
      events: null
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.listId !== prevProps.listId) {
      this.loadTasks(this.props.listId, 2022);
    }
  }

  loadTasks(listId, year) {
    const args = {
      "method": "rtm.tasks.getList",
      "list_id": listId,
      "filter": `status:completed AND completedAfter:${year}-01-01 AND completedBefore:${year}-12-31`,
      "auth_token": this.props.token
    };
    callRtmApi(getSignedUrl(args), (success, data) => {
      if (success) {
        if (!("list" in data["rsp"]["tasks"])) {
          alert("List has no data");
          return;
        }

        let eventList = [];
        for (const taskseries of data["rsp"]["tasks"]["list"][0]["taskseries"]) {
          const name = taskseries["name"];
          for (const task of taskseries["task"]) {
            const date = moment(task["due"]);
            eventList.push({
              content: name,
              range: moment.range(date, date)
            });
          }
        }
        this.setState({
          events: new Dayz.EventsCollection(eventList)
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
      "auth_token": this.props.token
    };
    if (year !== null) {
      args["filter"] = `status:completed AND completedAfter:${year}-01-01 AND completedBefore:${year}-12-31`;
    }
    callRtmApi(getSignedUrl(args), (success, data) => {
      if (success) {
        if (!("list" in data["rsp"]["tasks"])) {
          alert("List has no data");
          return;
        }

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
        downloadData(output, `${this.props.username}_${listId}_${year === null ? "all" : year}.csv`, "text/csv");
      }
      else {
        alert(`Api error: ${data["rsp"]["err"]["msg"]}`);
      }
    });
  }

  render() {
  	return(
  	  <div>
        Tasks
        <br />
        <button disabled={this.props.listId === null} onClick={() => this.downloadTasks(this.props.listId, 2022)}>Download</button>
        <br />
        <Dayz
           display="month"
           date={moment('2022-10-01')} events={this.state.events} />
      </div>
  	);
  }
}
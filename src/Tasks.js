import React, { Component } from "react";
import Dayz from "dayz";
import moment from "moment";
import { callRtmApi, getSignedUrl, downloadData, setStateHelper } from "./Util.js";
import "./dayz.scss";

const TaskField = Object.freeze({
  ADDED: 0,
  DUE: 1,
  COMPLETED: 2,
  NAME: 3,
  NOTES: 4,
  REPEATING: 5
});

export default class Tasks extends Component {
  constructor(props) {
    super(props);

    this.state = {
      date: moment(),
      display: TaskField.DUE,
      taskList: null,
      events: null
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.listId !== prevProps.listId) {
      this.loadTasks(this.props.listId, this.state.date.year());
    }
  }

  loadTasks(listId, year) {
    const args = {
      "method": "rtm.tasks.getList",
      "list_id": listId,
      "filter": `(dueAfter:${year}-01-01 OR completedAfter:${year}-01-01) AND addedBefore:${year}-12-31`,
      "auth_token": this.props.token
    };
    callRtmApi(getSignedUrl(args), (success, data) => {
      if (success) {
        if (!("list" in data["rsp"]["tasks"])) {
          alert("List has no data");
          return;
        }

        // iterate through tasks and remember desired fields
        let taskList = [];
        for (const taskseries of data["rsp"]["tasks"]["list"][0]["taskseries"]) {
          const name = taskseries["name"];
          const isRepeating = taskseries["task"].length > 1;
          let notes = [];
          if (taskseries["notes"].length !== 0) {
            taskseries["notes"]["note"].forEach(note => notes.push(note["$t"]));
          }
          for (const task of taskseries["task"]) {
            taskList.push([task["added"], task["due"], task["completed"], name, notes, isRepeating]);
          }
        }

        // sort tasks by added date
        taskList.sort((a, b) => a[0].localeCompare(b[0]));

        setStateHelper(this, "taskList", taskList, () => {
          this.loadEvents();
        });
      }
      else {
        alert(`Api error: ${data["rsp"]["err"]["msg"]}`);
      }
    });
  }

  loadEvents() {
    let eventList = [];
    for (const task of this.state.taskList) {
      const date = moment(task[this.state.display]);
      eventList.push({
        content: task[TaskField.NAME],
        range: moment.range(date, date),
        colorIndex: task[TaskField.COMPLETED] === "" ? 2 : 0
      });
    }
    setStateHelper(this, "events",  new Dayz.EventsCollection(eventList));
  }

  downloadTasks(listId, year=null) {
    if (this.state.taskList === null) {
      alert("No tasks loaded");
      return;
    }
    // desired output format
    let output = "added,due,completed,name,notes,repeating\n";
    for (const task of this.state.taskList) {
      for (const field of task) {
        output += `"${field}",`;
      }
      output += "\n";
    }
    // download tasks data
    downloadData(output, `${this.props.username}_${listId}_${year === null ? "all" : year}.csv`, "text/csv");
  }

  /**
   * Params:
   *  newDate : moment
   **/
  changeDate(newDate) {
    // if new date is in a different year, reload tasks for that year
    if (newDate.year() !== this.state.date.year()) {
      setStateHelper(this, "date", newDate, () => {
        this.loadTasks(this.props.listId, this.state.date.year());
      });
    }
    else {
      setStateHelper(this, "date", newDate);
    }
  }

  changeDisplay(newDisplay) {
    if (newDisplay !== this.state.display) {
      setStateHelper(this, "display", newDisplay, () => {
        this.loadEvents();
      })
    }
  }

  render() {
  	return(
  	  <div>
        Tasks
        <br />
        <select value={this.state.date.year()} onChange={(event) => this.changeDate(moment(event.target.value))}>
          { Array.from({length: 5}, (v, i) => moment().subtract(i, "years").year()).map((year, index) => 
            <option value={year}>{year}</option>
          )}
        </select>
        <button disabled={this.props.listId === null} onClick={() => this.downloadTasks(this.props.listId, this.state.date.year())}>
          Export {this.state.date.year()}
        </button>
        <select value={this.state.display} onClick={(event) => this.changeDisplay(event.target.value)}>
          <option value={TaskField.DUE}>Due</option>
          <option value={TaskField.ADDED}>Added</option>
          <option value={TaskField.COMPLETED}>Completed</option>
        </select>
        <br />
        <button onClick={() => this.changeDate(this.state.date.subtract(1, "months"))}>
          Prev
        </button>
        {this.state.date.format("MMMM")}
        <button onClick={() => this.changeDate(this.state.date.add(1, "months"))}>
          Next
        </button>
        <br />
        <Dayz display="month" date={this.state.date} events={this.state.events} highlightDays={[moment()]} />
      </div>
  	);
  }
}
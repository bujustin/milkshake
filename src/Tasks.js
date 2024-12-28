import React, { Component } from "react";
import Dayz from "dayz";
import moment from "moment";
import { Button, Dropdown } from "react-bootstrap";
import { setStateHelper, TaskField } from "./Util.js";
import "./css/tasks.css";
import "./css/dayz.scss";

/**
 * Props:
 *  taskList
 *  date
 *  changeDate(newDate)
 *  isLoading
 **/ 
export default class Tasks extends Component {
  constructor(props) {
    super(props);

    this.state = {
      display: TaskField.DUE,
      events: null
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.taskList !== prevProps.taskList) {
      this.loadEvents();
    }
  }

  loadEvents() {
    let eventList = [];
    if (this.props.taskList !== null) {
      for (const task of this.props.taskList) {
        const date = moment(task[this.state.display]);
        let colorIndex = 3;
        if (task[TaskField.COMPLETED] !== "") {
          colorIndex = 1;
          if (task[TaskField.DUE] !== "" && moment(task[TaskField.COMPLETED]).isAfter(moment(task[TaskField.DUE]))) {
            colorIndex = 2;
          }
        }
        eventList.push({
          content: task[TaskField.NAME],
          range: moment.range(date, date),
          // colors are configured in $dayz-event-colors in dayz.scss
          colorIndex: colorIndex
        });
      }
    }
    setStateHelper(this, "events",  new Dayz.EventsCollection(eventList));
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
        <div className="task-header-div">
          <div className="task-header-left-div">
            <Button size="sm" onClick={() => this.props.changeDate(moment().startOf("month"))}>
              Today
            </Button>
            &nbsp;
            { this.props.isLoading &&
              <i class="fa fa-refresh fa-spin fa-1x fa-fw" aria-hidden="true"></i>
            }
          </div>

          <div className="task-header-center-div">
            <span className="task-header-controls">
              <i class="fa fa-angle-left" aria-hidden="true" onClick={() => this.props.changeDate(this.props.date.clone().subtract(1, "months"))}></i>
            </span>
            <span className="task-header-month">
              {this.props.date.format("MMMM YYYY")}
            </span>
            <span className="task-header-controls">
              <i class="fa fa-angle-right" aria-hidden="true" onClick={() => this.props.changeDate(this.props.date.clone().add(1, "months"))}></i>
            </span>
          </div>

          <div className="task-header-right-div">
            <span>
              Display by
            </span>
            <Dropdown>
              <Dropdown.Toggle variant="link">
                {`${Object.keys(TaskField).find(key => TaskField[key] === this.state.display).toLowerCase()} date`}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item active={this.state.display === TaskField.DUE} onClick={() => this.changeDisplay(TaskField.DUE)}>Due</Dropdown.Item>
                <Dropdown.Item active={this.state.display === TaskField.ADDED} onClick={() => this.changeDisplay(TaskField.ADDED)}>Added</Dropdown.Item>
                <Dropdown.Item active={this.state.display === TaskField.COMPLETED} onClick={() => this.changeDisplay(TaskField.COMPLETED)}>Completed</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <Dayz display="month" date={this.props.date} events={this.state.events} highlightDays={[moment()]} />
      </div>
  	);
  }
}
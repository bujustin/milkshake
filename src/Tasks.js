import React, { Component } from "react";
import Dayz from "dayz";
import moment from "moment";
import { Button, Form } from "react-bootstrap";
import { setStateHelper } from "./Util.js";
import "./css/tasks.css";
import "./css/dayz.scss";

const TaskField = Object.freeze({
  ADDED: 0,
  DUE: 1,
  COMPLETED: 2,
  NAME: 3,
  NOTES: 4,
  REPEATING: 5
});

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
        eventList.push({
          content: task[TaskField.NAME],
          range: moment.range(date, date),
          colorIndex: task[TaskField.COMPLETED] === "" ? 2 : 1
        });
      }
    }
    setStateHelper(this, "events",  new Dayz.EventsCollection(eventList));
  }

  changeDisplay = (event) => {
    const newDisplay = parseInt(event.target.value);
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
            <Form>
              <Form.Check inline label="Due" type="radio" value={TaskField.DUE} checked={this.state.display === TaskField.DUE} onChange={this.changeDisplay} />
              <Form.Check inline label="Added" type="radio" value={TaskField.ADDED} checked={this.state.display === TaskField.ADDED} onChange={this.changeDisplay} />
              <Form.Check inline label="Completed" type="radio" value={TaskField.COMPLETED} checked={this.state.display === TaskField.COMPLETED} onChange={this.changeDisplay} />
            </Form>
          </div>
        </div>

        <Dayz display="month" date={this.props.date} events={this.state.events} highlightDays={[moment()]} />
      </div>
  	);
  }
}
import React, { Component } from "react";
import moment from "moment";
import Badge from "react-bootstrap/Badge";
import { setStateHelper, TaskField, StatFields } from "./Util.js";
import "./css/stats.css";

/**
 * Props:
 *  taskList
 *  date
 **/ 
export default class Stats extends Component {
  constructor(props) {
    super(props);

    this.state = {
      stats: this.getEmptyStats()
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.taskList !== prevProps.taskList) {
      this.calculateStats();
    }
  }

  getEmptyStats() {
    let stats = {};
    for (let i = 0; i < 12; i++) {
      stats[i] = {
        [StatFields.ADDED]: 0,
        [StatFields.COMPLETED_ONTIME]: 0,
        [StatFields.COMPLETED_OVERDUE]: 0,
        [StatFields.INCOMPLETE]: 0
      }
    }
    return stats;
  }

  calculateStats() {
    let stats = this.getEmptyStats();
    if (this.props.taskList !== null) {
      for (const task of this.props.taskList) {
        const addedDate = moment(task[TaskField.ADDED]);
        if (addedDate.year() === this.props.date.year()) {
          stats[addedDate.month()][StatFields.ADDED] += 1;
        }

        const dueDate = moment(task[TaskField.DUE]);
        const completedDate = moment(task[TaskField.COMPLETED]);
        if (completedDate.isValid() && completedDate.year() === this.props.date.year()) {
          stats[completedDate.month()][(!dueDate.isValid() || completedDate <= dueDate) 
            ? StatFields.COMPLETED_ONTIME : StatFields.COMPLETED_OVERDUE] += 1;
        }

        if (dueDate.isValid() && !completedDate.isValid() && dueDate.year() === this.props.date.year()) {
          stats[dueDate.month()][StatFields.INCOMPLETE] += 1;
        }
      }
    }
    setStateHelper(this, "stats", stats);
  }

  render() {
  	return(
      <div className="stats-div">
        Stats for {this.props.date.format("MMMM")}: 
        &nbsp;
        <Badge pill text="dark" className="stats-complete-pill">
          {StatFields.ADDED}: {this.state.stats[this.props.date.month()][StatFields.ADDED]}
        </Badge>
        &nbsp;
        <Badge pill text="dark" className="stats-complete-pill">
          {StatFields.COMPLETED_ONTIME}: {this.state.stats[this.props.date.month()][StatFields.COMPLETED_ONTIME]}
        </Badge>
        &nbsp;
        <Badge pill text="dark" className="stats-complete-pill">
          {StatFields.COMPLETED_OVERDUE}: {this.state.stats[this.props.date.month()][StatFields.COMPLETED_OVERDUE]}
        </Badge>
        &nbsp;
        <Badge pill text="dark" className="stats-incomplete-pill">
          {StatFields.INCOMPLETE}: {this.state.stats[this.props.date.month()][StatFields.INCOMPLETE]}
        </Badge>
      </div>
  	);
  }
}
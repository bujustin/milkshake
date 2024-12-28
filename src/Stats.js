import React, { Component } from "react";
import moment from "moment";
import { Badge, Dropdown } from "react-bootstrap";
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
      isYearlyStats: false,
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

  getStat(stats, name, isYearlyStats) {
    if (isYearlyStats) {
      return Object.values(stats).reduce((acc, stat) => acc + stat[name], 0);
    }
    return stats[this.props.date.month()][name];
  }

  render() {
  	return(
      <div className="stats-div">
        Stats for  
        <Dropdown>
          <Dropdown.Toggle variant="link">
            {this.state.isYearlyStats ? "Year" : "Month"}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item active={!this.state.isYearlyStats} onClick={() => setStateHelper(this, "isYearlyStats", false)}>Month</Dropdown.Item>
            <Dropdown.Item active={this.state.isYearlyStats} onClick={() => setStateHelper(this, "isYearlyStats", true)}>Year</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        ({this.props.date.format(this.state.isYearlyStats ? "YYYY" : "MMMM YYYY")})
        &nbsp;
        <Badge pill text="dark" className="stats-complete-pill">
          {StatFields.ADDED}: {this.getStat(this.state.stats, StatFields.ADDED, this.state.isYearlyStats)}
        </Badge>
        &nbsp;
        <Badge pill text="dark" className="stats-complete-pill">
          {StatFields.COMPLETED_ONTIME}: {this.getStat(this.state.stats, StatFields.COMPLETED_ONTIME, this.state.isYearlyStats)}
        </Badge>
        &nbsp;
        <Badge pill text="dark" className="stats-complete-overdue-pill">
          {StatFields.COMPLETED_OVERDUE}: {this.getStat(this.state.stats, StatFields.COMPLETED_OVERDUE, this.state.isYearlyStats)}
        </Badge>
        &nbsp;
        <Badge pill text="dark" className="stats-incomplete-pill">
          {StatFields.INCOMPLETE}: {this.getStat(this.state.stats, StatFields.INCOMPLETE, this.state.isYearlyStats)}
        </Badge>
      </div>
  	);
  }
}
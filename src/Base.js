import React, { Component } from "react";
import Container from "react-bootstrap/Container";
import { Nav, Navbar, NavDropdown } from "react-bootstrap";
import moment from "moment";
import Tasks from "./Tasks.js";
import { callRtmApi, getSignedUrl, writeCookie, readCookie, setStateHelper, downloadData } from "./Util.js";
import "./css/base.css";
import userIcon from "./user.png";

export default class Base extends Component {
  constructor(props) {
    super(props);

    this.state = {
      token: readCookie("token"),
      username: readCookie("username"),
      lists: null,
      selectedListId: null,
      taskList: null,
      date: moment().startOf("month"),
      isLoading: false
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
            this.loadLists();
          });
        }
        else {
          alert(`Authentication callback error: ${data["rsp"]["err"]["msg"]}`);
        }
      });
    }, 1000);
  };

  signOut() {
    writeCookie("token", "");
    writeCookie("username", "");
    this.setState({
      token: undefined,
      username: undefined,
      lists: null,
      selectedListId: null,
      taskList: null
    });
  }

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

        setStateHelper(this, "lists", lists, () => {
          this.changeSelectedList(selectedListId);
        });
      }
      else {
        alert(`rtm.lists.getList API error: ${data["rsp"]["err"]["msg"]}`);
      }
    });
  }

  loadTasks(listId, year) {
    const args = {
      "method": "rtm.tasks.getList",
      "list_id": listId,
      "filter": `(dueAfter:${year}-01-01 OR completedAfter:${year}-01-01) AND addedBefore:${year}-12-31`,
      "auth_token": this.state.token
    };
    callRtmApi(getSignedUrl(args), (success, data) => {
      if (success) {
        let taskList = [];
        if ("list" in data["rsp"]["tasks"]) {
          // iterate through tasks and remember desired fields
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
        }
        this.setState({
          taskList: taskList,
          isLoading: false
        });
      }
      else {
        alert(`rtm.tasks.getList API error: ${data["rsp"]["err"]["msg"]}`);
      }
    });
  }

  downloadTasks() {
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
    downloadData(output, `milkshake_${this.state.username}_${this.state.selectedListId}_${this.state.date.year()}.csv`, "text/csv");
  }

  changeSelectedList(newSelectedListId) {
    if (newSelectedListId !== this.state.selectedListId) {
      this.setState({
        selectedListId: newSelectedListId,
        date: moment().startOf("month"),
        isLoading: true
      }, () => {
        this.loadTasks(newSelectedListId, this.state.date.year());
      });
    }
  }

  /**
   * Params:
   *  newDate : moment
   **/
  changeDate(newDate) {
    // if new date is in a different year, reload tasks for that year
    if (newDate.year() !== this.state.date.year()) {
      this.setState({
        date: newDate,
        isLoading: true
      }, () => {
        this.loadTasks(this.state.selectedListId, this.state.date.year());
      });
    }
    else {
      setStateHelper(this, "date", newDate);
    }
  }

  render() {
    return(
      <div>
        <Navbar sticky="top" variant="dark" className="nav-bar base-font" >
          <Container>
            <Navbar.Brand href="#" className="nav-title-text">
              Milkshake
            </Navbar.Brand>
            <Navbar.Collapse className="justify-content-end">
              <NavDropdown className="nav-text" title="Lists" disabled={this.state.lists === null}>
                { this.state.lists !== null && this.state.lists.map((list, index) => 
                  <NavDropdown.Item onClick={() => this.changeSelectedList(list.id)} active={this.state.selectedListId === list.id} id={list.id}>
                    {list.name}
                  </NavDropdown.Item>
                )}
              </NavDropdown>
              <Nav className="nav-text" onClick={() => { if (this.state.token !== undefined) this.downloadTasks(); }}>
                Export List
              </Nav>
              <Nav className="nav-text">
                Show Stats
              </Nav>
              { this.state.token === undefined ?
                <Nav className="nav-text" onClick={() => this.authenticate()}>
                  Log in
                </Nav>
                :
                <NavDropdown bsPrefix="p-0" /*remove caret*/ title={
                  <img
                    alt=""
                    src={userIcon}
                    width="30"
                    height="30"
                    className="nav-text nav-user-icon "
                  />
                }>
                  <NavDropdown.Item disabled>
                    {this.state.username}
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={() => this.signOut()}>
                    Sign out
                  </NavDropdown.Item>
                </NavDropdown>
              }
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <div className="base-font base-body-div">
          <Tasks taskList={this.state.taskList} date={this.state.date} changeDate={(newDate) => this.changeDate(newDate)} isLoading={this.state.isLoading} />
        </div>
      </div>
    );
  }
}
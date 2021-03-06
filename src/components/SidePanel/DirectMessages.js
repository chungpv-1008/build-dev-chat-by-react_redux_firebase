import React, { Component } from 'react'
import { Menu, Icon } from 'semantic-ui-react'
import firebase from '../../firebase'
import { connect } from 'react-redux'
import { setCurrentChannel, setPrivateChannel } from '../../actions/index'

class DirectMessages extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      users: [],
      user: this.props.currentUser,
      userRef: firebase.database().ref("users"),
      connectedRef: firebase.database().ref(".info/connected"),
      presenceRef: firebase.database().ref("presence"),
      activeChannel: ""
    }
  }
  componentDidMount() {
    if(this.state.user) {
      this.addListener(this.state.user.uid);
    }
  }
  componentWillUnmount() {
    this.removeListeners();
  }
  removeListeners = () => {
    this.state.userRef.off();
    this.state.presenceRef.off();
    this.state.connectedRef.off();
  }
  addListener = (currentUserUid) => {
    let loadedUsers = [];
    this.state.userRef.on("child_added", snap => {
      if(currentUserUid !== snap.key) {
        let user = snap.val();
        user["uid"] = snap.key;
        user["status"] = "offline";
        loadedUsers.push(user);
        this.setState({
          users: loadedUsers
        });
      }
    });
    this.state.connectedRef.on("value", snap => {
      if(snap.val() === true) {
        const ref = this.state.presenceRef.child(currentUserUid);
        ref.set(true);
        ref.onDisconnect().remove(err => {
          if(err !== null) {
            console.error(err);
          }
        })
      }
    });
    this.state.presenceRef.on("child_added", snap => {
      if(currentUserUid !== snap.key) {
        this.addStatusToUser(snap.key)
      }
    });
    this.state.presenceRef.on("child_removed", snap => {
      if(currentUserUid !== snap.key) {
        this.addStatusToUser(snap.key, false);
      }
    });
  }
  addStatusToUser = (userId, connected = true ) => {
    const updateUsers = this.state.users.reduce((acc, user) => {
      if(user.uid === userId) {
        user["status"] = `${connected ? "online" : "offline"}`
      } 
      return acc.concat(user);
    }, []);
    this.setState({
        users: updateUsers
    });
  }
  isUserOnline = (user) => {
    return user.status === "online";
  }
  changeChannel = (user) => {
    const channelId = this.getChannelId(user.uid);
    const channelData = {
      id: channelId,
      name: user.name
    }
    this.props.setCurrentChannel(channelData);
    this.props.setPrivateChannel(true);
    this.setActiveChannel(user.uid);
  }
  setActiveChannel = (userId) => {
    this.setState({
      activeChannel: userId
    });
  }
  getChannelId = (userId) => {
    const currentUserId = this.state.user.uid;
    return userId < currentUserId ? `${userId}/${currentUserId}` : `${currentUserId}/${userId}`;
  }

  render() {
    const { users, activeChannel } = this.state;
    return (
      <Menu.Menu className="menu" >
        <Menu.Item style={{ backgroundColor: "#ffce", color: "black" }}>
          <span>
            <Icon name="mail" />
            DIRECT MESSAGES&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
          ({ URLSearchParams.length })
        </Menu.Item>
        {/* Users to send direct message */}
        {
          users.map(user => (
            <Menu.Item
              key={user.uid}
              active={user.uid === activeChannel}
              onClick={() => {this.changeChannel(user)}}
              style={{ opacity: 0.6, fontStyle: "italic" }}
            >
              <Icon
                name="circle"
                color={this.isUserOnline(user) ? "green" : "red"}
              />
              <span><Icon name="user" /></span>
              {user.name}
            </Menu.Item> 
          ))
        }
      </Menu.Menu>
    )
  }
}
export default connect(null,
  { setCurrentChannel, setPrivateChannel }, 
  null)(DirectMessages);
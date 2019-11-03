import React, { Component } from 'react'
import { Sidebar, Menu, Divider, Button, Modal, Icon, Label, Segment } from 'semantic-ui-react'
import { SliderPicker } from 'react-color'
import firebase from '../../firebase'
import { setColors } from '../../actions'
import { connect } from 'react-redux'

class ColorPanel extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      modal: false,
      privary: "",
      secondary: "",
      userRef: firebase.database().ref("users"),
      user: this.props.currentUser,
      userColors: []
    }
  }
  openModal = () => this.setState({ modal: true });
  closeModal = () => this.setState({ modal: false });
  handleChangePrimary = (color) => this.setState({ privary: color.hex });
  handleChangeSecondary = (color) => this.setState({ secondary: color.hex });
  handleSaveColors = () => {
    if(this.state.privary && this.state.secondary) {
      this.saveColors(this.state.privary, this.state.secondary);
    }
  }
  saveColors = (primary, secondary) => {
    this.state.userRef
      .child(`${this.state.user.uid}/colors`)
      .push()
      .update({
        primary,
        secondary
      })
      .then(() => {
        console.log("Colors added");
        this.closeModal();
      })
      .catch(err => {
        console.error(err);
      })
  }
  componentDidMount() {
    if(this.state.user) {
      this.addListender(this.state.user.uid);
    }
  }
  addListender = (userId) => {
    let userColors = [];
    this.state.userRef
      .child(`${userId}/colors`)
      .on("child_added", snap => {
        userColors.unshift(snap.val());
        this.setState({
          userColors: userColors
        });
      })
  }
  displayUserColors = (colors) => (
    colors.length > 0 && colors.map((color, i) => (
      <React.Fragment key={i}>
        <Divider />
        <div 
          className="color__container" 
          onClick={() => this.props.setColors(color.primary, color.secondary)}
        >
          <div className="color__square" style={{ background: color.primary }}>
            <div className="color__overlay" style={{ background: color.secondary }}>

            </div>
          </div>
        </div>
      </React.Fragment>
    ))
  )
  componentWillUnmount() {
    this.removeListener();
  }
  removeListener = () => {
    this.state.userRef
      .child(`${this.state.user.uid}/colors`)
      .off();
  }
  render() {
    const { modal, privary, secondary, userColors } = this.state;
    return (
      <Sidebar
        as={Menu}
        icon="labeled"
        invertied
        vertical
        visible
        width="very thin" >
        <Divider />
        <Button
          icon="add"
          size="small"
          color="blue"
          onClick={this.openModal}
        />
        { this.displayUserColors(userColors) }
        {/* Color Picker Modal */}
        <Modal
          basic
          open={modal}
          onClose={this.closeModal}
        >
          <Modal.Header>Choose App Colors</Modal.Header>
          <Modal.Content>
            <Segment inverted>
              <Label content="Primary Color" />
              <SliderPicker 
                color={privary}
                onChange={this.handleChangePrimary} 
              />
            </Segment>

            <Segment inverted>
              <Label content="Secondary Color" />
              <SliderPicker 
                color={secondary}
                onChange={this.handleChangeSecondary}
              />
            </Segment>

          </Modal.Content>
          <Modal.Actions>
            <Button color="green" inverted onClick={this.handleSaveColors} >
              <Icon name="checkmark" />
              Sava Colors
            </Button>
            <Button color="red" inverted onClick={this.closeModal} >
              <Icon name="remove" />
              Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </Sidebar>
    )
  }
}
export default connect(null, 
  { setColors }
)(ColorPanel)
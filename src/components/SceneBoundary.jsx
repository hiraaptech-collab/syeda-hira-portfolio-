import { Component } from 'react';

export default class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onReady?.(); }
  render() {
    return this.state.failed ? (this.props.fallback || <div className="phase1-scene-fallback" role="status">This 3D scene could not be loaded.</div>) : this.props.children;
  }
}

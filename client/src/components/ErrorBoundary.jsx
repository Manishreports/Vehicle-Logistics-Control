import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application runtime error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="error-boundary" role="alert">
        <section className="error-boundary-panel">
          <div className="error-boundary-code">Application Error</div>
          <h1>Something went wrong while loading this page.</h1>
          <p>Reload the application. The technical error is also available in the browser console.</p>
          <button type="button" className="primary-button" onClick={this.handleReload}>
            Reload Application
          </button>
        </section>
      </main>
    );
  }
}

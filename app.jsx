/** @jsx React.DOM */
var apiKey = "dc6zaTOxFJmzC"; // data.embed_url

var Form = React.createClass({
  handleSubmit: function(event) {
    event.preventDefault();
    var text = this.refs.text.getDOMNode().value;
    var slides = text.split("\n").filter(function(word) {
      return !!word.trim();
    });
    var promises = slides.map(function(word) {
      return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        var url = "http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=" + word;
        req.open("GET", url, true);
        req.setRequestHeader('Content-Type', 'application/json');
        req.setRequestHeader('Accept', 'application/json');
        req.responseType = 'json';
        req.onload = function() {
          try {
            resolve({
              word: word,
              image: req.response.data.image_original_url
            });
          } catch (error) {
            resolve({word: word});
          }
        };
        req.onerror = req.ontimeout = function(event) {
          reject({
            status: event.target.status,
            message: event.target.statusText,
            response: event.target,
          });
        };
        req.send();
      });
    });
    Promise.all(promises).then(function(slidesInfo) {
      this.props.onSlideInfoReceived(slidesInfo);
    }.bind(this));
  },

  componentDidMount: function() {

  },

  render: function() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          <textarea ref="text" defaultValue="cat" />
        </label>
        <button>Submit</button>
      </form>
    );
  }
});

var Slide = React.createClass({
  _getImage: function() {
    if (this.props.image) {
      return <img src={this.props.image} />;
    }
    return  (
      <p style={{background:"red", color:"#fff", height:"200px"}}>
        No result for {this.props.word}.
      </p>
    );
  },

  render: function() {
    return (
      <section>
        <h1>{this.props.word}</h1>
        {this._getImage()}
      </section>
    );
  }
});

var Slideshow = React.createClass({
  getInitialState: function() {
    return {slides: []};
  },

  componentDidUpdate: function() {
    Reveal.initialize();
  },

  onSlideInfoReceived: function(slidesInfo) {
    this.setState({slides: slidesInfo});
  },

  render: function() {
    var slidesComponents = this.state.slides.map(function(slide, i) {
      return <Slide key={i} word={slide.word} image={slide.image} />;
    }.bind(this));
    return (
      <div>
        <Form onSlideInfoReceived={this.onSlideInfoReceived} />
        <div className="reveal">
          <div className="slides">
            {slidesComponents}
          </div>
        </div>
      </div>
    );
  }
});

React.renderComponent(<Slideshow />, document.querySelector("#main"));

/** @jsx React.DOM */
var apiKey = "dc6zaTOxFJmzC"; // data.embed_url

var Form = React.createClass({
  handleSubmit: function(event) {
    event.preventDefault();
    var text = this.refs.text.getDOMNode().value;
    var slides = text.split("\n");
    var promises = slides.map(function(word) {
      return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        var url = "http://api.giphy.com/v1/gifs/search?q=" + word + "&api_key=dc6zaTOxFJmzC&limit=1&offset=0";
        req.open("GET", url, true);
        req.setRequestHeader('Content-Type', 'application/json');
        req.setRequestHeader('Accept', 'application/json');
        req.responseType = 'json';
        req.onload = function() {
          try {
            resolve({
              word: word,
              image: req.response.data[0].images.fixed_height.url
            });
          } catch (error) {
            reject(error);
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
    Promise.all(promises).then(function(slideInfo) {
      this.props.onSlideInfoReceived(slideInfo);
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
  render: function() {
    return (
      <section>
        <h1>{this.props.word}</h1>
        <img src={this.props.image} />
      </section>
    );
  }
});

var Slideshow = React.createClass({
  getInitialState: function() {
    return {slides: []};
  },

  onSlideInfoReceived: function(slideInfo) {
    this.setState({
      slides: this.state.slides.concat(slideInfo)
    });
  },

  render: function() {
    var slidesComponents = this.state.slides.map(function(slide, i) {
      console.log(slide, slide.word);
      return <Slide key={i} word={slide.word} image={slide.image} />;
    }.bind(this));
    return (
      <div>
        <Form onSlideInfoReceived={this.onSlideInfoReceived} />
        {slidesComponents}
      </div>
    );
  }
});

React.renderComponent(<Slideshow />, document.querySelector("#main"));

/** @jsx React.DOM */
var apiKey = "dc6zaTOxFJmzC"; // data.embed_url

function requestGifFromWord(word, resolve, reject) {
  var req = new XMLHttpRequest();
  var url = "http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=" + encodeURIComponent(word);
  req.open("GET", url, true);
  req.setRequestHeader("Content-Type", "application/json");
  req.setRequestHeader("Accept", "application/json");
  req.responseType = "json";
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
}

var Form = React.createClass({
  getDefaultProps: function() {
    return {text: ""};
  },

  getInitialState: function() {
    return {text: this.props.text};
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState({text: nextProps.text});
  },

  handleSubmit: function(event) {
    event.preventDefault();
    var text = this.refs.text.getDOMNode().value;
    var words = text.split("\n").filter(function(word) {
      return !!word.trim();
    });
    this.props.onWordsReceived(words);
    document.location.hash = words.join(",");
  },

  handleTextChange: function(event) {
    this.setState({text: event.target.value});
  },

  render: function() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          <textarea ref="text" value={this.state.text}
                    onChange={this.handleTextChange} />
        </label>
        <p><button>Submit</button></p>
      </form>
    );
  }
});

var Slide = React.createClass({
  render: function() {
    return (
      <section>
        {this.props.title ? <h1>{this.props.title}</h1> : null}
        {this.props.children}
      </section>
    );
  }
});

var WordSlide = React.createClass({
  _getImage: function() {
    if (this.props.image) {
      return <img src={this.props.image} />;
    }
    // XXX find another random image as a fallback
    return  (
      <p style={{background:"red", color:"#fff", height:"200px"}}>
        No result for {this.props.word}.
      </p>
    );
  },

  render: function() {
    return (
      <Slide title={this.props.word}>
        {this._getImage()}
      </Slide>
    );
  }
});

var Slideshow = React.createClass({
  getInitialState: function() {
    return {
      words: [],
      slides: []
    };
  },

  getWordsFromLocationHash: function() {
    return document.location.hash.slice(1).split(",").filter(function(word) {
      return !!word.trim();
    });
  },

  // XXX should be implemented, but check for how to check that
  // two arrays have diffed in js/react
  // shouldComponentUpdate: function(nextProps, nextState) {
  //   return nextState.words !== this.state.words;
  // },

  componentDidUpdate: function() {
    try {
      Reveal.initialize();
    } catch (e) {
      console.error(e.message);
    }
  },

  componentDidMount: function() {
    this.onWordsReceived(this.getWordsFromLocationHash());
    window.addEventListener("hashchange", function() {
      this.onWordsReceived(this.getWordsFromLocationHash());
    }.bind(this));
  },

  onWordsReceived: function(words) {
    this.setState({slides: [], words: words});
    var promises = words.map(function(word) {
      return new Promise(function(resolve, reject) {
        requestGifFromWord(word, resolve, reject);
      });
    });
    Promise.all(promises).then(function(slidesInfo) {
      this.setState({slides: slidesInfo});
    }.bind(this));
  },

  render: function() {
    var slidesComponents = this.state.slides.map(function(slide, i) {
      return <WordSlide key={i} word={slide.word} image={slide.image} />;
    }.bind(this));
    return (
      <div>
        <div className="reveal">
          <div className="slides">
            <Slide title="Inslides">
              <p>Enter one term per line and generate a fancy slideshow.</p>
              <Form text={this.state.words.join("\n")}
                    onWordsReceived={this.onWordsReceived} />
            </Slide>
            {slidesComponents}
          </div>
        </div>
      </div>
    );
  }
});

React.renderComponent(<Slideshow />, document.querySelector("#main"));

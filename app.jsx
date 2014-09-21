/** @jsx React.DOM */
var apiKey = "dc6zaTOxFJmzC"; // data.embed_url

function requestGifFromWord(word, resolve, reject) {
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
}

var Form = React.createClass({
  getDefaultProps: function() {
    return {text: ""};
  },

  getInitialState: function() {
    return {text: this.props.text || ""};
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
    console.log("text changed", event.target.value);
    this.setState({text: event.target.value});
  },

  render: function() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          <textarea ref="text" value={this.state.text}
                    onChange={this.handleTextChange} />
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
    return {
      words: this.getWordsFromUrlHash(),
      slides: []
    };
  },

  getWordsFromUrlHash: function() {
    var hash = document.location.hash;
    if (!hash || hash.length === 0) {
      return [];
    }
    return hash.slice(1).split(",");
  },

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
    var words = this.getWordsFromUrlHash();
    this.onWordsReceived(words);
    window.addEventListener("hashchange", function(event) {
      console.log("hash words changed", this.getWordsFromUrlHash());
      var words = this.getWordsFromUrlHash();
      this.onWordsReceived(words);
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
    console.log('Slideshow#state:', this.state);
    console.log("joined", this.state.words.join("\n"));
    var slidesComponents = this.state.slides.map(function(slide, i) {
      return <Slide key={i} word={slide.word} image={slide.image} />;
    }.bind(this));
    // XXX: bug: Form component should be notified of words state changes
    return (
      <div>
        <Form text={this.state.words.join("\n")}
              onWordsReceived={this.onWordsReceived} />
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

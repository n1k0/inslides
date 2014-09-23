/** @jsx React.DOM */
var GiphyAPI = {
  apiKey: "dc6zaTOxFJmzC", // Giphy public API key
  baseUrl: "https://api.giphy.com/v1/gifs",

  _buildUrl: function(endpoint, params) {
    // XXX if we wanted to do things properly, we should build a full qs instead
    params = params || {};
    var url = this.baseUrl + endpoint + "?api_key=" + this.apiKey;
    if ("tag" in params) {
      url += "&tag=" + encodeURIComponent(params.tag);
    }
    return url;
  },

  request: function(endpoint, params, resolve, reject) {
    var req = new XMLHttpRequest();
    req.open("GET", this._buildUrl(endpoint, params), true);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Accept", "application/json");
    req.responseType = "json";
    return new Promise(function(resolve, reject) {
      req.onload = function() {
        try {
          resolve({image: req.response.data.image_original_url});
        } catch (error) {
          reject({});
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
  }
};

function textToWords(text) {
  return text.split("\n").filter(function(word) {
    return !!word.trim();
  });
}

function wordsToHash(words) {
  return words.join(",");
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
    this.props.updateWords(textToWords(this.refs.text.getDOMNode().value));
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
        <p><button>Let me ridicule myself</button></p>
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
  shouldComponentUpdate: function(nextProps) {
    return nextProps.word !== this.props.word;
  },

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

var Loader = React.createClass({
  getDefaultProps: function() {
    return {current: 0};
  },

  render: function() {
    if (!this.props.total || !this.props.current) {
      return null;
    }
    if (this.props.total === this.props.current) {
      return (
        <p>
          Your slideshow is ready. Press the right arrow key and speak up.
          Press <kbd>ESC</kbd> to get an overview.
        </p>
      );
    }
    return (
      <p>GIFing slide {this.props.current}/{this.props.total}.</p>
    );
  }
});

var Slideshow = React.createClass({
  getInitialState: function() {
    return {
      words: this.getWordsFromLocationHash(),
      slides: []
    };
  },

  getWordsFromLocationHash: function() {
    return document.location.hash.slice(1).split(",").filter(function(word) {
      return !!word.trim();
    });
  },

  componentDidUpdate: function() {
    try {
      Reveal.initialize();
    } catch (e) {
      console.error(e.message);
    }
  },

  componentWillMount: function() {
    window.addEventListener("hashchange", this.onUrlHashChanged);
  },

  componentDidMount: function() {
    this.generateSlides();
  },

  onUrlHashChanged: function() {
    Reveal.navigateTo(0);
    this.setState({words: this.getWordsFromLocationHash()});
    this.generateSlides();
  },

  /**
   * Words list is updated by setting the current URL hash.
   * @param  {Array} words List of words.
   */
  updateWords: function(words) {
    // Side effect!
    document.location.hash = wordsToHash(words);
  },

  generateSlides: function() {
    this.setState({loading: 0});
    var promises = this.state.words.map(function(word) {
      return GiphyAPI.request("/random", {tag: word}).then(function(result) {
        if (!result.image) {
          return GiphyAPI.request("/random").then(function(result) {
            this.setState({loading: this.state.loading + 1});
            result.word = word;
            return result;
          }.bind(this));
        }
        this.setState({loading: this.state.loading + 1});
        result.word = word;
        return result;
      }.bind(this));
    }.bind(this));
    Promise.all(promises).then(function(slidesInfo) {
      this.setState({slides: slidesInfo});
      //Reveal.navigateRight();
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
            <Slide title={<h1><a href="./#">Inslides</a></h1>}>
              <p>Enter one term per line and generate a fancy slideshow.</p>
              <Form text={this.state.words.join("\n")}
                    updateWords={this.updateWords}
                    onWordsReceived={this.onWordsReceived} />
              <Loader total={this.state.words.length}
                      current={this.state.loading} />
            </Slide>
            {slidesComponents}
          </div>
        </div>
      </div>
    );
  }
});

React.renderComponent(<Slideshow />, document.querySelector("#main"));

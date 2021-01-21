const conf = {
  inputEvent: 'input',
  clickEvent: 'click',
  keydownEvent: 'keydown',
  upKeyCode: 38,
  downKeyCode: 40,
  enterCode: 13
}

class AirportsGetter {
  async makeRequest(value) {
    let term = encodeURI(value);
    let url = `http://autocomplete.travelpayouts.com/places2?term=${term}&locale=ru`
    let response = await fetch(url)
      .then(raw => raw.json())
      .then(j => this.parseResponse(j))
      .then(res => res.slice(0, 5))

    return response;
  }

  parseResponse(response) {
    let result = [];
    for (let item of response) {
      let airportData = this.getAirportData(item);
      if (airportData !== null) {
        result.push(airportData);
      }
    }

    return result;
  }

  getAirportData(responseObject) {
    const mainAirportName = responseObject.main_airport_name;
    const name = responseObject.name;
    const code = responseObject.code;
    const country = responseObject.country_name;
    const cityName = responseObject.city_name;

    if (mainAirportName !== null && mainAirportName !== undefined) {
      return `${name}, ${mainAirportName}, ${code}, ${country}`
    } else if (mainAirportName === undefined) {
      return `${cityName}, ${name}, ${code}, ${country}`;
    } else return null;
  }

  // Не совсем понял, как должен работать дебаунс, тут он всегда возвращает undefined
  getAirports(value) {
    let func = this.debounce(this.makeRequest, 1000);
    let res = func(value);
    console.log(res)
    return func(value);
  }

  debounce(f, ms) {
    let isCooldown = false;
  
    return function () {
      if (isCooldown) return;
      f.apply(this, arguments);
      console.log(this)
      isCooldown = true;
      setTimeout(() => isCooldown = false, ms);
    };
  }
}

class AirportService {
  constructor(getter) {
    this.getter = getter;
  }

  async get(request) {
    const res = await this.getter.makeRequest(request);
    if (res.length > 0) {
      return res;
    } else return [];
  }
}

class AirportViewController {
  constructor(input, service) {
    this.input = input;
    this.service = service;
    this.focus;
  }

  async get(request) {
    let suggests = await this.service.get(request);
    this.showSuggests(suggests);
  }

  handleInputChange() {
    this.focus = -1;
    let inputValue = this.input.value;
    this.clear();
    if (inputValue.length > 2) this.get(inputValue);
  }

  clear(item) {
    let items = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < items.length; i++) {
      if (item != items[i] && items != this.input) {
        items[i].parentNode.removeChild(items[i]);
      }
    }
  }

  handleKey(event) {
    let items = document.getElementById(this.input.id + "autocomplete-list");
    if (items) items = items.getElementsByTagName("div");
    if (event.keyCode === conf.enterCode) {
      event.preventDefault();
      if (this.focus > -1) {
        if (items) items[this.focus].click();
      }
    } else if (event.keyCode === conf.upKeyCode) {
      event.preventDefault();
      this.focus--;
      this.addActive(items);
    } else if (event.keyCode === conf.downKeyCode) {
      event.preventDefault();
      this.focus++;
      this.addActive(items);
    }
  }

  handleClick(event) {
    this.clear(event.target);
  }

  addActive(items) {
    if (!items) return;
    this.removeActive(items);
    if (this.focus >= items.length) this.focus = 0;
    if (this.focus < 0) this.focus = (items.length - 1);
    this.addActiveSuggests(items, this.focus);
  }

  removeActive(items) {
    this.removeActiveSuggests(items);
  }


  removeActiveSuggests(items) {
    for (var i = 0; i < items.length; i++) {
        items[i].classList.remove("autocomplete-active");
     }
  }

  addActiveSuggests(items, current) {
    items[current].classList.add("autocomplete-active");
  } 

  listen() {
    this.input.addEventListener(conf.inputEvent, this.handleInputChange.bind(this));
    this.input.addEventListener(conf.keydownEvent, this.handleKey.bind(this));
    document.addEventListener(conf.eventClick, this.handleClick.bind(this));
  }

  clicked(index) {
    return () => {
        let text = document.getElementsByClassName("title")[index].innerHTML;
        this.input.value = text;
        this.clear();
    }
  }

  showSuggests(suggests) {
    this.clear();

    let val = this.input.value;
    this.clear();
    if (!val) return;
    let newNode = document.createElement("div");
    newNode.setAttribute("id", this.input.id + "autocomplete-list");
    newNode.setAttribute("class", "autocomplete-items");
    this.input.parentNode.appendChild(newNode);
    for (let i = 0; i < suggests.length; i++) {
        let newestNode = document.createElement("div");
        newestNode.innerHTML = "<p class='title'>" + suggests[i] + "</p>";
        newestNode.addEventListener(conf.clickEvent, this.clicked(i).bind(this));
        newNode.appendChild(newestNode);
    }
  }
}

async function enableFetching() {
  let input = document.getElementById('suggester');
  let getter = new AirportsGetter();
  let service = new AirportService(getter);
  let controller = new AirportViewController(input, service);
  controller.listen();

}
enableFetching();

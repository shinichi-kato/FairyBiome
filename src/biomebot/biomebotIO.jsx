import Part from './part.jsx';
import {localStorageIO} from './localStorageIO';

export default class BiomeBotIO {
  constructor(){
    // 書誌的事項(会話中に変化しない)
    this.config = {
      trueName : "",
      firstUser: "",
      buddyUser: "",
      displayName: null,
      photoURL : null,
      description : null,
      defaultPartOrder:[],
      hubBehavior: {
        availability: 0.3,
        generosity: 0.9,
        retention: 0.6,
      },
    };
    
    // 単語辞書(大きいので分離)
    this.wordDict={empty:true}

    // パート本体(大きいので分離)
    this.parts={empty:true};

    // 会話中の動的な状態を記述する項目
    this.state={
      partOrder:[],
      activeInHub: false,
      hp: 0,
      queue:[],
      buddy: "none",  // none:なし, follow:随行中, 
                      // home:Home, habitat:Habitat
    };
    this.updatedAt = null;

  }

  isLoaded = () => {
    return this.state.site !== "none"
  };

  isVacantInLocalStorage = () => {
    return localStorageIO.getItem('Biomebot.state',false) === false;
  };

  isFairyYoung = () => {
    return this.displayName === "";
  }


  setConfig = (config,updatedAt) => {
    const b = config.hubBehavior;
    this.config = {
      ...config,
      hubBehavior:{
        availability: parseFloat(b.availability),
        generosity: parseFloat(b.generosity),
        retention: parseFloat(b.retention),
      }
    };
    this.updatedAt = updatedAt;
    localStorageIO.setItem('Biomebot.config',JSON.stringify(this.config));
    localStorageIO.setItem('Biomebot.updatedAt',JSON.stringify(this.updatedAt));
    console.log("setConfig:",this.config);

  };

  setWordDict = (wordDict,updatedAt) => {
    this.wordDict= {...wordDict};
    this.updatedAt = updatedAt;
    localStorageIO.setItem('Biomebot.wordDict',JSON.stringify(this.wordDict));
    localStorageIO.setItem('Biomebot.updatedAt',JSON.stringify(this.updatedAt));
  }

  readObj = (obj) => {
    this.setConfig(obj.config);
    this.wordDict={...obj.wordDict};

    const partNames = Object.keys(obj.parts);
    for(let part of partNames){
      this.parts[part].readObj(obj.parts[part]);
    }
    delete this.parts['empty'];

    this.state={
      ...obj.state,
      partorder:[...obj.config.defaultPartOrder],
    };
    
  };

  readLocalStorage = () => {
    const state = localStorageIO.getJson('Biomebot.state');
    if(state === null){return false};
    
    const config = localStorageIO.getJson('Biomebot.config');
    this.config = {
      ...config,
      hubBehavior:{
        availability: parseFloat(config.hubBehavior.availability),
        generosity: parseFloat(config.hubBehavior.generosity),
        retention: parseFloat(config.hubBehavior.retention),       
      }
    };
    
    this.wordDict = localStorageIO.getJson('Biomebot.wordDict');
    this.parts = {empty:false};
    for(let partName of state.partOrder){
      let part = localStorageIO.getJson(`Biomebot.part[${partName}]`);
      if(this.parts[partName]){
        this.parts[partName].readObj(part);
      }else{
        this.parts[partName] = new Part(part);
      }
    }
    
    this.state = {...state};
    this.updatedAt = localStorage.getJson('Biomebot.updatedAt');
    console.log("readlocal",this.config)
    return true;

  };
  
  upkeepToLocalStorage = () => {
    // this.stateのみ更新
    localStorageIO.setItem('Biomebot.state',JSON.stringify(this.state));
  };
  
  dumpToLocalStorage = () => {
    // 全データの保存
    localStorageIO.setItem('Biomebot.config',JSON.stringify(this.config));
    localStorageIO.setItem('Biomebot.wordDict',JSON.stringify(this.wordDict));

    for (let partName of this.state.partOrder){
      localStorageIO.setItem(`Biomebot.part[${partName}]`,
      JSON.stringify(this.parts[partName].dump()));
    }
    localStorageIO.setItem('Biomebot.updatedAt',this.updatedAt);
    this.upkeepToLocalStorage();
  };

  
}
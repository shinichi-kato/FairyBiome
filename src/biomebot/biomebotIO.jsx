import Part from "./part.jsx";
import { localStorageIO } from "./localStorageIO";

/* firestore上でのデータの構造
collection("bots")
  .doc(id)
    config: {
      trueName: TextString,
      firstUser: TextString,
      buddyUser: TextString,
      displayName: TextString,
      photoUrl: TextString,
      description: TextString,
      defaultPartOrder: Array,
      initialHp: number
      hubBehavior: Map,
    },
    state: {
      partOrder: Array,
      activeInHub: Boolean,
      hp: Integer,
      queue: Array,
      buddy: TextString,
    },
    updatedAt: DateAndTime,

    .collection("wordDict")
      .doc("wordDict")
        wordDict: Map // サイズが大きいため別のdocにする

    .collection("parts")
      .doc(`${partName}`) // サイズが大きいため別のdocにする
        behavior: Map
        dict: Array

*/

export default class BiomeBotIO {
  constructor() {
    this.init();
  }

  init = () => {
    // 書誌的事項(会話中に変化しない)
    this.firestoreDocId = null;
    this.firestoreOwnerId = null;
    this.ownerDisplayName = null;
    this.config = {
      trueName: "",
      firstUser: "",
      buddyUser: "",
      displayName: null,
      photoURL: null,
      description: null,
      defaultPartOrder: [],
      inintialHp: 10,
      hubBehavior: {
        availability: 0.3,
        generosity: 0.9,
        retention: 0.6,
      },
    };

    // 単語辞書(大きいので分離)
    this.wordDict = { empty: () => true };

    // パート本体(大きいので分離)
    this.parts = { empty: () => true };

    // 会話中の動的な状態を記述する項目
    this.state = {
      partOrder: [],
      activeInHub: false,
      hp: 0,
      queue: [],
      buddy: null, // null: アンロード状態
      // "none":非バディ,
      // "follow":随行中,
      // "home":ユーザから離れてHomeにいる,
      // "habitat":ユーザから離れてHabitatにいる
    };
    this.updatedAt = null;
  }

  isLoaded = () => {
    return this.state.buddy !== null;
  };

  isVacantInLocalStorage = () => {
    return localStorageIO.getItem("Biomebot.state", false) === false;
  };

  isFairyYoung = () => {
    return this.config.displayName === "";
  }

  getBuddyState = () => {
    const config = localStorageIO.getJson("Biomebot.config", false);
    const state = localStorageIO.getJson("Biomebot.state", false);
    if (!state || !config) {
      return {
        displayName: null,
        photoURL: null,
        buddy: null,
        hp: null
      };
    }
    return {
      displayName: config.displayName,
      photoURL: config.photoURL,
      buddy: state.buddy,
      hp: state.hp
    };
  }

  setConfig = (config, updatedAt) => {
    const b = config.hubBehavior;
    this.config = {
      ...config,
      hubBehavior: {
        availability: parseFloat(b.availability),
        generosity: parseFloat(b.generosity),
        retention: parseFloat(b.retention),
      }
    };
    this.updatedAt = updatedAt;
    localStorageIO.setItem("Biomebot.firestoreOwnerId", this.firestoreOwnerId);
    localStorageIO.setItem("Biomebot.firestoreDocId", this.firestoreDocId);
    localStorageIO.setItem("Biomebot.config", JSON.stringify(this.config));
    localStorageIO.setItem("Biomebot.updatedAt", JSON.stringify(this.updatedAt));
  };

  setPart = (partName, part, updatedAt) => {
    this.parts[partName].readObj(part);
    this.updatedAt = updatedAt;
    localStorageIO.setItem(`Biomebot.part[${partName}]`, JSON.stringify(part));
    localStorageIO.setItem("Biomebot.updatedAt", JSON.stringify(this.updatedAt));
  };

  removePart = (partName) => {
    delete this.parts[partName];
    localStorageIO.removeItem(`Biomebot.part[${partName}]`);
  }

  setWordDict = (wordDict, updatedAt) => {
    this.wordDict = { ...wordDict };
    let wdict = { ...wordDict };
    delete wdict["{!!BOT_NAME}"];
    delete wdict["{!!LAST_SPEECH}"];
    delete wdict["{!!SECOND_LAST_SPEECH}"];
    delete wdict["{!!THIRD_LAST_SPEECH}"];

    localStorageIO.setItem("Biomebot.wordDict", JSON.stringify(wdict));

    if (updatedAt) {
      this.updatedAt = updatedAt;
      localStorageIO.setItem("Biomebot.updatedAt", JSON.stringify(wdict));
    }
  }

  retrieveSpeeches = (speeches) => {
    // チャットログの末尾３発言をwordDictに格納
    if (speeches.length > 0) {
      this.wordDict["{!!LAST_SPEECH}"] = speeches[0];
    }
    if (speeches.length > 1) {
      this.wordDict["{!!SECOND_LAST_SPEECH}"] = speeches[1];
    }
    if (speeches.length > 2) {
      this.wordDict["{!!THIRD_LAST_SPEECH}"] = speeches[2];
    }
  }

  setState = (state, updatedAt) => {
    this.state = { ...state };
    this.updatedAt = updatedAt;
    localStorageIO.setItem("Biomebot.state", JSON.stringify(this.state));
    localStorageIO.setItem("Biomebot.updatedAt", JSON.stringify(this.updatedAt));
  }

  readObj = (obj) => {
    const b = obj.config.hubBehavior;
    this.firestoreOwnerId = obj.firestoreOwnerId;
    this.ownerDisplayName = obj.ownerDisplayName;
    this.firestoreDocId = obj.firestoreDocId;
    this.config = {
      ...obj.config,
      hubBehavior: {
        availability: parseFloat(b.availability),
        generosity: parseFloat(b.generosity),
        retention: parseFloat(b.retention),
      }
    };

    this.wordDict = { ...obj.wordDict };

    const partNames = Object.keys(obj.parts);
    for (let part of partNames) {
      this.parts[part] = new Part(obj.parts[part]);
    }
    delete this.parts.empty;

    this.state = {
      ...obj.state,
      partOrder: [...obj.config.defaultPartOrder],
    };
  };

  getFairyFromLocalStorage = () => {
    const ownerId = localStorageIO.getItem("Biomebot.firestoreOwnerId");
    const ownerName = localStorageIO.getItem("Biomebot.ownerDisplayName");
    const docId = localStorageIO.getItem("Biomebot.firestoreDocId");
    const state = localStorageIO.getJson("Biomebot.state");
    if (state === null) { return false; }
    const config = localStorageIO.getJson("Biomebot.config");
    const wordDict = localStorageIO.getJson("Biomebot.wordDict");
    const updatedAt = localStorageIO.getJson("Biomebot.updatedAt");

    let parts = {};

    for (let partName of config.defaultPartOrder) {
      parts[partName] = localStorageIO.getJson(`Biomebot.part[${partName}]`);
    }

    return {
      firestoreOwnerId: ownerId,
      ownerDisplayName: ownerName,
      firestoreDocId: docId,
      config: {
        ...config,
        hubBehavior: {
          availability: parseFloat(config.hubBehavior.availability),
          generosity: parseFloat(config.hubBehavior.generosity),
          retention: parseFloat(config.hubBehavior.retention),
        }
      },
      wordDict: wordDict,
      parts: parts,
      state: state,
      updatedAt: updatedAt,
    };
  }

  readLocalStorage = () => {
    this.firestoreOwnerId = localStorageIO.getItem("Biomebot.firestoreOwnerId");
    this.ownerDisplayName = localStorageIO.getItem("Biomebot.ownerDisplayname");
    this.firestoreDocId = localStorageIO.getItem("Biomebot.firestoreDocId");
    const state = localStorageIO.getJson("Biomebot.state");
    if (state === null) { return false; }

    const config = localStorageIO.getJson("Biomebot.config");
    this.config = {
      ...config,
      hubBehavior: {
        availability: parseFloat(config.hubBehavior.availability),
        generosity: parseFloat(config.hubBehavior.generosity),
        retention: parseFloat(config.hubBehavior.retention),
      }
    };

    this.wordDict = localStorageIO.getJson("Biomebot.wordDict");
    if (this.parts.empty) {
      delete this.parts.empty;
    }
    for (let partName of config.defaultPartOrder) {
      let part = localStorageIO.getJson(`Biomebot.part[${partName}]`);
      if (this.parts[partName]) {
        this.parts[partName].readObj(part);
      } else {
        this.parts[partName] = new Part(part);
      }
    }

    this.state = { ...state };
    this.updatedAt = localStorageIO.getJson("Biomebot.updatedAt");
    return true;
  };

  restart = () => {
    this.state = {
      partOrder: [...this.config.defaultPartOrder],
      activeInHub: false,
      hp: this.state.hp,
      queue: [],
      buddy: this.state.buddy
    };
  }

  upkeepToLocalStorage = () => {
    // this.stateのみ更新
    localStorageIO.setItem("Biomebot.state", JSON.stringify(this.state));
  };

  dumpToLocalStorage = (fairy) => {
    if (fairy) {
      this.readObj(fairy);
    }
    // 全データの保存
    localStorageIO.setItem("Biomebot.firestoreOwnerId", this.firestoreOwnerId);
    localStorageIO.setItem("Biomebot.ownerDisplayname", this.ownerDisplayName);
    localStorageIO.setItem("Biomebot.firestoreDocId", this.firestoreDocId);
    localStorageIO.setItem("Biomebot.config", JSON.stringify(this.config));
    localStorageIO.setItem("Biomebot.wordDict", JSON.stringify(this.wordDict));

    for (let partName of this.config.defaultPartOrder) {
      localStorageIO.setItem(`Biomebot.part[${partName}]`,
        JSON.stringify(this.parts[partName].dump()));
    }
    localStorageIO.setItem("Biomebot.updatedAt", this.updatedAt);
    this.upkeepToLocalStorage();
  };

  dumpToFirestore = (fb, that = null) => {
    // firestoreへの全データの保存
    if (that === null) {
      that = this;
    }
    this.firestoreOwnerId = fb.user.uid;
    this.ownerDisplayName = fb.user.displayName;
    const fs = fb.firestore;
    let wdict = { ...that.wordDict };
    delete wdict["{!!BOT_NAME}"];
    delete wdict["{!!LAST_SPEECH}"];
    delete wdict["{!!SECOND_LAST_SPEECH}"];
    delete wdict["{!!THIRD_LAST_SPEECH}"];

    this.findBotId(fs, that).then(id => {
      if (!id) {
        // firestoreDocIdが指定されていない場合、
        // config.trueNameとconfig.ownerIdが同一であれば同じボットとみなす。
        fs.collection("bots")
          .add({
            firestoreOwnerId: this.firestoreOwnerId,
            ownerDisplayName: this.ownerDisplayName,
            config: that.config,
            state: {
              partOrder: that.state.partOrder,
              activeInHub: that.state.activeInHub,
              hp: that.state.hp,
              queue: that.state.queue
            },
            buddy: that.state.buddy,
            updatedAt: fb.timestampNow()
          })
          .then(docRef => {
            that.firestoreDocId = docRef.id;
            localStorageIO.setItem("Biomebot.firestoreDocId", that.firestoreDocId);

            docRef.collection("wordDict")
              .doc("wordDict").set(wdict);

            const partsRef = docRef.collection("parts");
            for (let partName of that.config.defaultPartOrder) {
              partsRef.doc(partName).set(that.parts[partName].dump());
            }
          });
      } else {
        const docRef = fs.collection("bots").doc(id);
        docRef.set({
          firestoreOwnerId: ownerId,
          ownerDisplayName: ownerName,
          config: that.config,
          state: {
            partOrder: that.state.partOrder,
            activeInHub: that.state.activeInHub,
            hp: that.state.hp,
            queue: that.state.queue
          },
          buddy: that.state.buddy,
          updatedAt: fb.timestampNow()
        });
        docRef.collection("wordDict")
          .doc("wordDict").set(wdict);

        const partsRef = docRef.collection("parts");
        for (let partName of that.config.defaultPartOrder) {
          partsRef.doc(partName).set(that.parts[partName].dump());
        }
      }
    });
  };

  findBotId = async (fs, that) => {
    const id = that.firestoreDocId !== "undefined" && that.firestoreDocId;
    if (id) { return id; }

    const snapshot = await fs.collection("bots")
      .where("config.trueName", "==", that.config.trueName)
      .where("config.firestoreOwnerId", "==", that.firestoreOwnerId)
      .limit(1)
      .get();

    const data = snapshot.docs.map(doc => doc.id);

    return data[0];
  };
}

export const readFromFirestore = async (fb, docId) => {
  const docRef = fb.firestore.collection("bots").doc(docId);
  const doc = await docRef.get();
  const data = doc.data();
  let fairy = {
    firestoreDocId: docId,
    firestoreOwnerId: data.firestoreOwnerId,
    ownerDisplayName: data.ownerDispalyName,
    config: { ...data.config },
    state: {
      ...data.state,
      buddy: data.buddy,
    },
    updatedAt: data.updatedAt,
    wordDict: {},
    parts: {}
  };

  const wdRef = docRef.collection("wordDict").doc("wordDict");
  const wdData = await wdRef.get();
  fairy.wordDict = { ...wdData.data() };

  const partsRef = docRef.collection("parts");
  const partsData = await partsRef.get();
  for (let part of partsData.docs) {
    let partData = part.data();
    fairy.parts[part.id] = { ...partData };
  }

  return fairy;
};

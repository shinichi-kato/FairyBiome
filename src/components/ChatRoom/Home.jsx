import React, { useContext, useEffect, useState, useRef } from "react";
import { navigate } from "gatsby";

import { localStorageIO } from "../../utils/localStorageIO";

import { makeStyles } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import Fab from "@material-ui/core/Fab";
import FairyBiomeIcon from "../../icons/FairyBiome";

import ApplicationBar from "../ApplicationBar/ApplicationBar";
import { RightBalloon, LeftBalloon } from "./balloons.jsx";
import Console from "./console.jsx";
import { toTimestampString } from "../to-timestamp-string.jsx";
import { FirebaseContext } from "../Firebase/FirebaseProvider";
import { BotContext } from "../ChatBot/BotProvider";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    height: "100vh",
    backgroundImage: "url(../images/landing-bg.png)",
    backgroundPosition: "center bottom",
  },
  main: {
    height: "calc( 100vh - 64px - 48px )",
    overflowY: "scroll",
    overscrollBehavior: "auto",
    WebkitOverflowScrolling: "touch",
    padding: 0
  },
  floatingButton: {
    position: "absolute",
    left: theme.spacing(4),
    top: 80
  }
}));

export default function Home({location}) {
  const classes = useStyles();
  const fb = useContext(FirebaseContext);
  const bot = useContext(BotContext);
  const [log, setLog] = useState(localStorageIO.getJson("homeLog", []));
  const [botBusy, setBotBusy] = useState(false);

  const user = fb.user;
  const userDisplayName = user.displayName;
  const botDisplayName = `${bot.displayName}@${userDisplayName}`;
  const site = useRef({
    title: "",
    hubTitle: "集合場所",
    localLogLinesMax: 20,
    chatLinesMax: 20
  });

  if (location.state?.data) {
    site.current = {
    title: location.state.data.title,
    hubTitle: location.state.data.hubTitle,
    localLogLinesMax: location.state.data.localLogLinesMax,
    chatLinesMax: location.state.data.chatLinesMax
    };
  }

  useEffect(() => {
    setBotBusy(true);
    bot.deployHome()
      .then(() => {
        setBotBusy(false);
      });
  }, []);

  function setNavigateBefore() {
    /* 戻るボタンを押したときの動作を記述し、戻り先アドレスを返す */
    bot.restart();
    bot.dumpToLocalStorage();
    return ("/fairybiome/Dashboard");
  }

  function writeLog(message) {
    setLog(prevLog => {
      /* 連続selLog()で前のselLog()が後のsetLog()で上書きされるのを防止 */
      const newLog = [...prevLog, message];
      newLog.slice(-site.current.localLogLinesMax);
      localStorageIO.setJson("homeLog", newLog);
      return newLog;
    });
  }

  function handleWriteMessage(text) {
    if (text === null) {
      return;
    }
    const message = {
      displayName: user.displayName,
      photoURL: user.photoURL,
      text: text,
      speakerId: user.uid,
      timestamp: toTimestampString(fb.timestampNow()),
    };

    writeLog(message);

    setBotBusy(true);
    bot.replyHome(user.displayName, text)
      .then(reply => {
        if (reply.text !== null) {
          writeLog({
            displayName: botDisplayName,
            photoURL: reply.photoURL,
            text: reply.text,
            speakerId: bot.displayName,
            timestamp: toTimestampString(fb.timestampNow())
          });
          setBotBusy(false);
        }
      });
    // .catch(e=>{
    //   writeLog({
    //     displayName:"error",
    //     photoURL:"",
    //     text:e.message,
    //     speakerId:bot.DisplayName,
    //     timestamp:toTimestampString(fb.timestampNow())
    //   })
    //   setBotBusy(false);
    // })
  }

  const logSlice = log.slice(-site.current.chatLinesMax);
  const speeches = logSlice.map(speech => {
    return (speech.speakerId === user.uid || speech.speakerId === -1) ?
      <RightBalloon key={speech.timestamp} speech={speech} />
      :
      <LeftBalloon key={speech.timestamp} speech={speech} />;
  }
  );

  // --------------------------------------------------------
  // currentLogが変更されたら最下行へ自動スクロール
  const chatBottomEl = useRef(null);
  const parentEl = useRef(null);
  useEffect(() => {
    if (chatBottomEl.current) {
      chatBottomEl.current.scrollIntoView({ behavior: "smooth", block: "start"});
    }
  }, [log]);

  return (
    <>
      <Box
        alignContent="flex-start"
        className={classes.root}
        display="flex"
        flexDirection="column"
        flexWrap="nowrap"
        justifyContent="flex-start"
      >
        <Box>
          <ApplicationBar
            busy={botBusy}
            setNavigateBefore={setNavigateBefore}
            title={site.current.title} />
        </Box>
        <Box className={classes.main} flexGrow={1} order={0} ref={parentEl}>
          {speeches}
          <div ref={chatBottomEl} />
        </Box>
        <Box justifyContent="center" order={0}>
          <Console
            handleWriteMessage={handleWriteMessage}
            position={"0"} />
        </Box>
      </Box>
      {bot.ref.state.buddy !== null &&
        <Fab
          aria-label="edit"
          className={classes.floatingButton}
          color="secondary"
          onClick={() => navigate("/fairybiome/Editor",
            {state: {hubTitle: site.current.hubTitle}}
          )}
        >
          <FairyBiomeIcon />
        </Fab>
      }
    </>
  );
}

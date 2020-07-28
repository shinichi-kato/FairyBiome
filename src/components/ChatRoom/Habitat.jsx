import React ,{useContext,useEffect,useState,useRef } from "react";
import { StaticQuery,graphql } from "gatsby"

import { makeStyles } from '@material-ui/core/styles';

import Box from '@material-ui/core/Box';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';

import ApplicationBar from '../ApplicationBar/ApplicationBar';
import {FirebaseContext} from '../Firebase/FirebaseProvider';
import {BotContext} from '../ChatBot/BotProvider';

const HABITAT={
  update_interval:1, // 生息地にいる妖精の顔ぶれが更新されるまでの時間(分) 
  numberBehavior:{
    mean:3,   // 妖精出現数の平均値
    stdDev:0.5 // 幼生出現数の標準偏差 
  },
  hpBehavior:{
    mean:50, // 出現する妖精のHP最大値の平均値
    stdDev:20 // 出現する妖精のHP最大値の標準偏差
  }
}

function random_norm(behavior) {
  //平均0、標準偏差1の正規乱数を返す。
  //https://stabucky.com/wp/archives/9263
  var s, i;
  s = 0;
  for(i = 0; i < 12; i++) {
    s += Math.random();
  }
  return behavior.mean + (s - 6)*behavior.stdDev;
}

function randomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// Habitatにいる妖精を抽出
const query = graphql`
query {
  allFairyJson(filter: {state: {site: {eq: "habitat"}}}) {
    edges {
      node {
        config {
          displayName
          photoURL
          buddyUser
        }
        state {
          hp
          buddy
        }
      }
    }
  }
}
`;

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    height: "100vh",
    backgroundImage: "url(../images/landing-bg.png)",
    backgroundPosition: "center bottom",
  },
  bar: {
    borderRadius: 5,
    height: 10,
    backgroundColor: ""
  },


}));


export default function Habitat(props){
  /*
    妖精の生息地

    firestore や /static/fairy上にある妖精のうち、
    ランダムに何体かが現れる。そのうちの一体を選んで会話できる。
    妖精と会話すると、仲間にできる場合がある。

    妖精の出現傾向
    妖精が出現する数はnumber{mean,stdDev}で与えられる正規分布に従い、
    また出現できる妖精のHP最大値はhp{mean,stdDev}で与えられる正規分布に従う。
  */
  const classes = useStyles();

  const fb = useContext(FirebaseContext);
  const bot = useContext(BotContext);
  const fairiesListRef = useRef(null);
  const hpMaxRef = useRef(randomInt(100));
  const [fairies,setFairies] = useState([]);

  const seed = Math.floor(fb.timestampNow().seconods/(60*HABITAT.update_interval));

  function GetFairiesList(props){
    // fairiesListをuseStateで構成すると、「render内でのsetState」
    // というwarningになる。これは useStaticQuery()で回避できるが、
    // 2020.7現在ではuseStaticQuery() 自体にバグがあり、undefined
    // しか帰ってこない。
    // 
    // そこで useRef を代替とし、データ取得のみのサブコンポーネントを用いる。  

    
    if(props.data){
      fairiesListRef.current = props.data.allFairyJson.edges.map(edge=>({
        displayName:edge.node.config.displayName,
        photoURL: edge.node.config.photoURL,
        buddyUser:edge.node.config.buddyUser,
        hp:edge.node.state.hp
      }));
    }
    console.log(fairiesListRef.current)
    return null;
  }

  function FairyAvatar(props){
    return (
      <Box
        display="flex"
        flexDirection="column"
      >
        <Box>
          <Avatar src={`../../fairy/${props.photoURL}`}/>
        </Box>
        <Box>
          <Typography>{props.displayName}</Typography>
        </Box>
        <Box>
          <LinearProgress
            className={classes.bar}
            variant="determinate"
            size={100}
            value={Number(props.hp)} />
        </Box>
      </Box>
    )
  }

  useEffect(()=>{
    // queryでHabitatにいる妖精を抽出し、そのの中から
    // 出現する妖精の数を決める
    if(fairiesListRef.current){
      let allFairies = fairiesListRef.current.filter(fairy=>fairy.hp<hpMaxRef.current);

      let selectedFairies = [];
      const numOfFairies = Math.min(random_norm(HABITAT.numberBehavior),allFairies.length);
      for(let i=0; i<numOfFairies; i++){
        let index = randomInt(allFairies.length);
        selectedFairies.push(allFairies[index])
        delete allFairies[index];
      }
      setFairies([...selectedFairies])
  
    }

  },[fairiesListRef.current])

  

  return (
    <>
      {fairiesListRef.current === null &&
        <StaticQuery
          query={query}
          render={data=><GetFairiesList data={data} />}
        />
      }
      <Box 
        display="flex"
        flexDirection="column"
        flexWrap="nowrap"
        justifyContent="flex-start"
        alignContent="flex-start"
      >
        <Box>
          <ApplicationBar title="妖精の生息地" />
        </Box>
        <Box 
          display="flex"
          flexDirection="row"
        >
          {fairies.map((fairy,index)=><FairyAvatar {...fairy} key={index}/>)}

        </Box>
      </Box>
    </>
  )
}
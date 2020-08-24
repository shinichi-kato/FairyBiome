import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";

import Avatar from "@material-ui/core/Avatar";
import Box from "@material-ui/core/Box";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import Slide from "@material-ui/core/Slide";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Input from "@material-ui/core/Input";
import CardHeader from "@material-ui/core/CardHeader";
import IconButton from "@material-ui/core/IconButton";
import ArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import ArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import EditIcon from "@material-ui/icons/Edit";
import AlbumIcon from "@material-ui/icons/Album";
import ContactIcon from "@material-ui/icons/ContactSupport";
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";

import Part from "../../biomebot/part.jsx";

const useStyles = makeStyles((theme) => ({
  content: {
    padding: theme.spacing(2),

  },
  margin: {
    margin: theme.spacing(1),
  },
  input: {
    padding: theme.spacing(2),
    backgroundColor: "#EEEEEE",
    borderRadius: 4,

  },
  partCard: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1)
  }

}));

const typeAvatar = {
  "recaller": { "icon": <AlbumIcon />, color: "#22547A" },
  "learner": { "icon": <ContactIcon />, color: "#841460" }
};

function NewPartButton(props) {
  const classes = useStyles();
  const [value, setValue] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    props.handleCreatePart(value);
    setValue("");
  }

  const isDuplicated = props.partOrder.indexOf(value) !== -1;
  return (
    <Card
      className={classes.partCard}
    >
      <form onSubmit={handleSubmit}>
        <Input
          onChange={e => setValue(e.target.value)}
          value={value}
        />
        <Button
          disabled={value === "" || isDuplicated}
          fullWidth
          size="large"
          startIcon={<AddCircleOutlineIcon />}
          type="submit"
          variant="contained"
        >
          新しいパートを追加
        </Button>
        <Typography color="error">
          {isDuplicated && "同じ名前のパートは作れません"}
        </Typography>

      </form>
    </Card>
  );
}

export default function PartOrder(props) {
  const classes = useStyles();

  // partOrder, setPartOrderはpropsからもらう
  // parts, setPartsはpropsからもらう
  const [cursor, setCursor] = useState();
  const [move, setMove] = useState();

  function handleRaise(name) {
    setCursor(name);
    setMove("raise");
  }

  function handleDrop(name) {
    setCursor(name);
    setMove("drop");
  }

  function handleChanged() {
    props.setPartOrder(prevOrder => {
      let order = [...prevOrder];
      const index = order.indexOf(cursor);

      if (move === "raise") {
        if (index > 0) {
          order.splice(index, 1);
          order.splice(index - 1, 0, cursor);
        }
      } else if (move === "drop") {
        if (index >= 0 && index < order.length) {
          order.splice(index, 1);
          order.splice(index + 1, 0, cursor);
        }
      }
      return order;
    });
    setCursor(null);
    setMove(null);
  }

  function handleCreatePart(name) {
    let newPart = new Part();
    props.handleSavePart({name, newPart});
    props.setPartOrder(prevOrder => ([...prevOrder, name]));
  }

  function PartCard(childProps) {
    /* props:
     {
       name: str,
       type: str,
       key: str,
       behavior:{
         availability: float,
         generosity: float,
         retention: float
       },
       dictSize: int
     }

   */
    const availability = childProps.behavior.availability.toFixed(2);
    const generosity = childProps.behavior.generosity.toFixed(2);
    const retention = childProps.behavior.retention.toFixed(2);

    function handleClick() {
      childProps.handleChangePage(`part-${childProps.name}`);
    }

    return (
      <Card
        className={classes.partCard}
      >
        <CardHeader
          action={
            <IconButton
              aria-label="edit"
              onClick={handleClick}
            >
              <EditIcon />
            </IconButton>
          }
          avatar={
            <Avatar aria-label="part" className={classes.avatar}>
              {typeAvatar[childProps.type].icon}
            </Avatar>
          }
          subheader={`稼働率:${availability} 寛容性:${generosity} 継続率:${retention}`}
          title={childProps.name}
        />
        <CardActions disableSpacing>

          <IconButton
            onClick={e => handleRaise(childProps.name)}
          >
            <ArrowUpIcon />
          </IconButton>
          <IconButton
            onClick={e => handleDrop(childProps.name)}
          >
            <ArrowDownIcon />
          </IconButton>
        </CardActions>
      </Card>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
    >
      {props.partOrder.map(part =>
        (<Box key={part}>
          <Slide
            direction="right"
            in={cursor !== part}
            onExited={handleChanged}
            timeout={300}
          >
            <div>
              <PartCard
                {...props.parts[part]}
                handleChangePage={props.handleChangePage}
                name={part}
              />
            </div>
          </Slide>
        </Box>)
      )}
      <NewPartButton
        handleCreatePart={handleCreatePart}
        partOrder={props.partOrder}
      />
    </Box>

  );
}

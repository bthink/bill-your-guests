import { useState, useMemo, useEffect } from 'react'
import { TextField, Button, IconButton, List, ListItem, ListItemText, Paper } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import * as R from 'ramda'
import duck from './assets/duck.png'
import duckbg from './assets/duckbg.png'  
import OpenAI from "openai";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY; 


if (!apiKey) {
  throw new Error('apikey environment variable is missing or empty.');
}

function App() {
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [gptResponse, setGptResponse] = useState(null)
  const [isPending, setIsPending] = useState(false)

  const handleAddItem = () => {
    if (!newItem.trim()) return
    setItems(R.append(newItem.trim()))
    setNewItem('')
  }

  const handleDeleteItem = (index) => {
    setItems(R.remove(index, 1))
  }

  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const handleSendToGPT = async () => {
    setIsPending(true)
    try {
      const itemsString = items.join(', ')
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You will be provided with a list of common products and you will estimate their summarized value in USD, and give only single number as answer. If you don't know any product, count it as 0." },
            {
                role: "user",
                content: itemsString,
            },
        ],
    });
  
      setGptResponse(completion);
    } catch (error) {
      console.error('Error generating text:', error);
      setGptResponse('Error generating text');
    } finally {
      setIsPending(false)
    }
  };



  const response = useMemo(() => R.pathOr(0, ['choices', 0, 'message', 'content'], gptResponse) + "USD!", [gptResponse])


  useEffect(() => {
    if (isPending) {
      console.log('Our experts are calculating...');
    }
  }, [isPending]);

  return (
    <div className="flex justify-center items-center w-screen h-screen bg-[#042630] bg-repeat p-10">
      {gptResponse === null ? (
        <Paper className="p-6 max-w-2xl mx-auto" elevation={3}>
        <div className="flex justify-center items-center mb-4">
          <img src={duck} alt="Duck" className="mb-4" style={{width: '50%', height: '50%', textAlign: 'center'}} />
        </div>

        <div className="flex justify-center items-center mb-4">Want to save money, but guests keep coming?
          Check how much you spend on them:</div>
        <div className="flex gap-2 mb-4 text-left">
          <TextField
            fullWidth
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            placeholder="They ate, drank, used..."
            size="small"
          />
          <Button 
            variant="contained" 
            onClick={handleAddItem}
            className="whitespace-nowrap"
          >
            Add
          </Button>
        </div>
        <List className="mb-4">
          {items.map((item, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton edge="end" onClick={() => handleDeleteItem(index)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>

        <Button
          variant="contained"
          color="secondary"
          fullWidth
          onClick={handleSendToGPT}
          disabled={items.length === 0 || isPending}
          className="mb-4"
        >
          {isPending ? 'Sending to Diodak...' : 'Estimate losses'}
        </Button>
        </Paper>) : 
        <Paper elevation={3} className="p-0 mt-4 bg-gray-50">    
            {response !== "0USD!" ? 
            <div className="whitespace-pre-wrap absolute top--20 left-0 w-full text-center text-4xl text-white" style={{textShadow: '0 0 8px #fff'}}>{response}</div> : null}
            {response === "0USD!" ? 
            <div className="text-center w-full p-10">Looks like you only suffered moral losses. Maybe they can come back...</div> :
             <img src={duckbg} alt="Duck" className="w-[100%] h-[50%] text-center"  />}
          </Paper>
}
    </div>
  )
}


export default App

import './ActivityForm.css';
import React from "react";
import process from 'process';
import {ReactComponent as BombIcon} from './svg/bomb.svg';

export default function ActivityForm(props) {
  const [count, setCount] = React.useState(0);
  const [message, setMessage] = React.useState('');
  const [ttl, setTtl] = React.useState('7-days');
  const [errors, setErrors] = React.useState('');

  const classes = []
  classes.push('count')
  if (240-count < 0){
    classes.push('err')
  }

  const onsubmit = async (event) => {
    event.preventDefault();
    setErrors('')
    try {
      const backend_url = `${process.env.REACT_APP_BACKEND_URL}/api/activities`
      console.log('onsubmit payload', message)
      const res = await fetch(backend_url, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({
          message: message,
          ttl: ttl
        }),
      });
      let data = await res.json();
      if (res.status === 200) {
        // add activity to the feed
        props.setActivities(current => [data,...current]);
        // reset and close the form
        setCount(0)
        setMessage('')
        setTtl('7-days')
        props.setPopped(false)
      } else {
        console.log(res)
        if (res.status === 422) {
          if (data[0] == 'NoAuthorizationHeader' || data[0] == 'Unauthenticated') {
            setErrors('You must be logged in to post messages!')
          } else if (data[0] == 'BlankMessage') {
            setErrors('Please enter the message!')
          } else if (data[0] == 'MessageExceedMaxChars') {
            setErrors('Message exceeded 280 character limit!')
          } else if (data[0] == 'BlankTtl') {
            setErrors('Please specify message TTL!')
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  const textarea_onchange = (event) => {
    setCount(event.target.value.length);
    setMessage(event.target.value);
  }

  const ttl_onchange = (event) => {
    setTtl(event.target.value);
  }

  let el_errors;
  if (errors){
    el_errors = <div className='errors'>{errors}</div>;
  }

  if (props.popped === true) {
    return (
      <form 
        className='activity_form'
        onSubmit={onsubmit}
      >
        <textarea
          type="text"
          placeholder="what would you like to say?"
          value={message}
          onChange={textarea_onchange} 
        />
        {el_errors}
        <div className='submit'>
          <div className={classes.join(' ')}>{240-count}</div>
          <button type='submit'>Crud</button>
          <div className='expires_at_field'>
            <BombIcon className='icon' />
            <select
              value={ttl}
              onChange={ttl_onchange} 
            >
              <option value='30-days'>30 days</option>
              <option value='7-days'>7 days</option>
              <option value='3-days'>3 days</option>
              <option value='1-day'>1 day</option>
              <option value='12-hours'>12 hours</option>
              <option value='3-hours'>3 hours</option>
              <option value='1-hour'>1 hour </option>
            </select>
          </div>
        </div>
      </form>
    );
  }
}
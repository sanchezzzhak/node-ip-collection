const readline = require('readline/promises');
const {stdin: input, stdout: output} = require('process');

const createAnswer = async (message) => {
  const rl = readline.createInterface({input, stdout});
  const answer = await rl.question(message + ' ');
  rl.close();
  return answer;
}


(async () => {
 
  let inc = 0;
  let valueData = {};
  let ipv4Data = [];
  let ipv6Data = [];
  
  let database = await createAnswer('set path csv file database:');
  await console.log('Columns format: first two columns range ip')
  let columns  = await createAnswer('set columns for separator |:');
  
  console.log(database, columns)
  
})()


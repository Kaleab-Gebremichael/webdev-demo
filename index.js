const express = require('express')
const cors = require('cors')
const graphqlHTTP = require('express-graphql')
const gql = require('graphql-tag')
const { buildASTSchema } = require('graphql')

const app = express()
app.use(cors())

const schema = buildASTSchema(gql`
  type Query {
    move(id: ID): Move
    person(userName: String): Person
    game(id: ID): Game
  }

  type Person {
    id: ID
    userName: String
    firstName: String
    lastName: String
    games: [Game]
  }

  type Game {
    id: ID
    owner: Person
    game: GameState
    moves: [Move]
  }

  type Move {
    id: ID
    user: Person
    game: ID
    cards: [Card]
    src: String
    dst: String
  }

  type GameState {
    id: ID
    pile1: [Card]
    stack1: [Card]
    discard: [Card]
    draw: [Card]
  }

  enum Suit {
    hearts
    spades
    diamonds
    clubs
  }

  type Card {
    suit: Suit
    value: String
    up: Boolean
  }

  // type Mutation {
  //   newPlayer(input: PersonInput!): Person
  // }

  // input PersonInput {
  //   id: ID
  //   userName: String
  //   firstName: String
  //   lastName: String
  // }

`)

const PEOPLE = new Map()
const MOVES = new Map()
const GAMES = new Map()

const setup_fake_data = () => {
    const fakeGameStates = [
	{id: '1', pile1: [{suit: 'hearts', value: '6', up: true}], stack1: [], discard: [], draw:[]},
	{id: '2', pile1: [], stack1: [], discard: [{suit: 'spades', value: 'king', up: false}], draw:[]},
    ]

    const fakeMoves = [
	{id: '1', game: '1', cards: [{suit: 'hearts', value: '6', up: true}, {suit: 'spades', value: 'king', up: false}], src: 'pile1', dst: 'discard'},
	{id: '2', game: '2', cards: [{suit: 'diamonds', value: '5', up: false}, {suit: 'clubs', value: '2', up: true}], src: 'stack1', dst: 'pile1'},
    ]
    
    const fakePeople = [
	{ id: '1', userName: 'userA', firstName: 'Keanu', lastName: 'Reeves' },
	{ id: '2', userName: 'userB', firstName: 'Ryan', lastName: 'Gosling' }
    ]

    const fakeGames = [
	{id: '1', owner: fakePeople[0], game: fakeGameStates[0], moves: [fakeMoves[0]]},
	{id: '2', owner: fakePeople[1], game: fakeGameStates[1], moves: [fakeMoves[1]]},
	{id: '3', owner: fakePeople[0], game: fakeGameStates[1], moves: [fakeMoves[0], fakeMoves[1]]},
    ]

    fakePeople[0].games = [fakeGames[0], fakeGames[2]]
    fakePeople[1].games = [fakeGames[1]]
    
    fakePeople.forEach(person => PEOPLE.set(person.userName, person))
    fakeMoves.forEach(move => MOVES.set(move.id, move))
    fakeGames.forEach(game => GAMES.set(game.id, game))

}

setup_fake_data();

//resolvers
const rootValue = {
    move: ({id}) => MOVES.get(id),
    person: ({userName}) => PEOPLE.get(userName),
    game: ({id}) => GAMES.get(id),
    // newPlayer: async ({input}, {headers}) => {
    // 	//do authentication/authorization ...

    // 	PEOPLE.set( input.userName, {id: input.id, userName: input.userName, firstName: input.firstName, lastName: input.lastName, games: []})
    // 	// or save to db

    // 	return PEOPLE.get(input.userName)
    // }
}

app.use('/graphql', graphqlHTTP({ schema, rootValue }))

const port = process.env.PORT || 8080
app.listen(port)
console.log(`Running a GraphQL API server at http://localhost:${port}/graphql`)

interface User {
  id?: string
  username: string
  password: string
  email: string
}

type Username = Pick<User, 'username'>
type Password = Pick<User, 'password'>
type UserID = Pick<User, 'id'>
type UserLogin = Pick<User, 'username' | 'password'>
type UserInfo = Pick<User, 'username' | 'email'>

interface ErrorDB {
  message: string;
  code:number;
}

interface Card {
  id: string
  title: string
  content: string
  section_id: string
  position: number
}

interface Section {
  id: string
  title: string
  user_id: string
  cards: Card[]
  position: number
}
type SectionID = Pick<Section, 'id'>
type SectionInfo = Omit<Section, 'cards'>

interface UserData {
  sections: Section[]
}


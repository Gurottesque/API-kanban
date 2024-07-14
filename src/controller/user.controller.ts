import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { KanbanDB } from '../model/db-kanban.js';
import { validate } from 'uuid';
dotenv.config()

interface CustomRequest extends Request {
  session: {
      user: any;
  };
}

const SECRET_KEY = process.env.SECRET_KEY ?? '123456'
export class UserController {

    static async checkSession (req: CustomRequest, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization;
    
        req.session = { user: null };
    
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(403).send('Forbidden request: You are not authorized not header');
        }
        const token = authHeader.split(' ')[1];

        try {
            const data = jwt.verify(token, SECRET_KEY);
            req.session.user = data; // Asignar los datos del usuario al objeto session
        } catch (e) { return res.status(401).send('Forbidden request: You are not authorized' + e)} 
    
        next()
    }

    static async getUserData  (req: CustomRequest, res: Response) {

        const { user_id } = req.session.user
        
        const userData = await KanbanDB.getAllUserSections(user_id)

        if ('message' in userData) return res.status(userData.code).send(userData.message)
    
        res.send(userData)
    }

    static async createSection (req: CustomRequest, res: Response)  {

        const { user_id } = req.session.user
        const { title, position } = req.body
    
        if (!title) 
            return res.status(400).send("Bad request: missing title field")

        if (!position) 
            return res.status(400).send("Bad request: missing position field")


        const section = await KanbanDB.addSection(title, user_id, position)

        if ('message' in section) return res.status(section.code).send(section.message)

        res.status(201).send(section)
    
    }

    static async deleteSection (req: CustomRequest, res: Response)  {
        const { user_id } = req.session.user
        const { section_id } = req.body

        if (!validate(section_id)) return res.status(400).send('Error: Incorrect UUID')

        const section_user_id = await KanbanDB.getUserID(section_id)

        if ('message' in section_user_id) return res.status(section_user_id.code).send(section_user_id.message)
    
        if (section_user_id.id != user_id) 
            return res.status(403).send('Forbidden request: The section doesnt belong to this user')
    
        
        const section_deleted = await KanbanDB.deleteSection(section_id)
        if ('message' in section_deleted) return res.status(section_deleted.code).send(section_deleted.message)

        res.send(section_deleted)
    }

    static async createCard (req: CustomRequest, res: Response) {

        const { user_id } = req.session.user
        const { title, content, section_id, position } = req.body
    
        
        if (!title || !content || !section_id || !position) 
            return res.status(400).send("Bad request: missing fields")
    
        if (!validate(section_id)) return res.status(401).send('Error: Incorrect UUID')
    
        const section_user_id = await KanbanDB.getUserID(section_id)

        if ('message' in section_user_id) return res.status(section_user_id.code).send(section_user_id.message)
        if (section_user_id.id != user_id) 
            return res.status(403).send('Forbidden request: The section doesnt belong to this user')
    
        
        const card = await KanbanDB.addCards(title, content, section_id, position)

        if ('message' in card) return res.status(card.code).send(card.message)

        res.status(201).send(card)
    
    }

    static async deleteCard (req: CustomRequest, res: Response) {
        const { user_id } = req.session.user
        const { card_id } = req.body
    
        if (!card_id) 
            return res.status(400).send("Bad request: missing card id field")

        if (!validate(card_id)) return res.status(401).send('Error: Incorrect UUID')
        
        const section_id = await KanbanDB.getSectionID(card_id)
        if ('message' in section_id) return res.status(section_id.code).send(section_id.message)
    
    
        const section_user_id = await KanbanDB.getUserID(section_id.id)
        if ('message' in section_user_id) return res.status(section_user_id.code).send(section_user_id.message)

        if (section_user_id.id != user_id) 
            return res.status(403).send('Forbidden request: The section doesnt belong to this user')
     
        const cardDeleted= await KanbanDB.deleteCard(card_id)

        if ('message' in cardDeleted) return res.status(cardDeleted.code).send(cardDeleted.message)

        res.send(cardDeleted)
    
    }

    static async updateAccount (req: CustomRequest, res: Response) {
        const { user_id } = req.session.user;
        const { username, email, password } = req.body;

        const userUpdated = await KanbanDB.updateUser(user_id, {username, email, password})

        if ('message' in userUpdated) return res.status(userUpdated.code).send(userUpdated.message)
        res.send(userUpdated)
    }


    static async getUserInfo  (req: CustomRequest, res: Response) {

        const { user_id } = req.session.user
        
        const userData = await KanbanDB.getUserInfo(user_id)
        if ('message' in userData) return res.status(userData.code).send(userData.message)
    
        res.send(userData)
    }

    static async updateSection (req: CustomRequest, res: Response) {
        const { user_id } = req.session.user;
        const { title, position } = req.body;

        const sectionUpdated = await KanbanDB.updateSection(user_id, {title, user_id, position})

        if ('message' in sectionUpdated) return res.status(sectionUpdated.code).send(sectionUpdated.message)
        res.send(sectionUpdated)
    }

    static async updateCard (req: CustomRequest, res: Response) {
        const { user_id } = req.session.user;
        const { title, content, card_id, section_id, position } = req.body;

        // verificar que el usuario sea el dueño de la sección que quiera cambiar
        const section_user_id = await KanbanDB.getUserID(section_id)
        if ('message' in section_user_id) return res.status(section_user_id.code).send(section_user_id.message)

        if (section_user_id.id != user_id) 
            return res.status(403).send('Forbidden request: The section doesnt belong to this user')
        // verificar que la seccion de la carta sea del usuario
        
        const card_section_id = await KanbanDB.getSectionID(card_id)
        if ('message' in card_section_id) return res.status(card_section_id.code).send(card_section_id.message)

        const section_user_id2 = await KanbanDB.getUserID(card_section_id.id)

        if ('message' in section_user_id2) return res.status(section_user_id2.code).send(section_user_id2.message)

        if (section_user_id2.id != user_id) 
            return res.status(403).send('Forbidden request: The card section doesnt belong to this user')

            
        const cardUpdated = await KanbanDB.updateCard(card_id, {title, content, section_id, position})

        if ('message' in cardUpdated) return res.status(cardUpdated.code).send(cardUpdated.message)
        res.send(cardUpdated)
    }




}

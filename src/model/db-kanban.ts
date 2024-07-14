
import { connect, Client } from 'ts-postgres';
import bcrypt from 'bcrypt';



export class KanbanDB {
    
    private static client: Client | null = null;

    private static async getClient(): Promise<Client> {
        const port = process.env.DB_PORT as unknown as number
        if (!KanbanDB.client) {
            KanbanDB.client = await connect({
                user: process.env.DB_USER,
                host: process.env.DB_HOST,
                password: process.env.DB_PASS,
                database: process.env.DB_NAME,
                port: port
            });
        }
        return KanbanDB.client;
    }
    
    static async searchUser(username: string) : Promise<Username | ErrorDB>{
        try {
            const client = await KanbanDB.getClient(); 
            const data = await client.query(`SELECT username FROM users WHERE username = $1`, [username]);
            if (data.rows.length === 0) return { username: ''}
            return { username: data.rows[0][0] }; 

        } catch(e) { 
            console.log(e)
            const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500 };
            return error
          }
      }

    static async getPassword(username: string) : Promise<Password | ErrorDB>{ 
        try {
            const client = await KanbanDB.getClient();

            const data = await client.query(`SELECT password FROM users WHERE username = $1`, [username]);
            if (data.rows.length > 0) {
              return { password: data.rows[0][0] }; 
          } else {
              return { message: 'Incorrect user name or password', code: 401 }; 
          }
        } catch(e) { 
          console.log(e)
          const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500  };
          return error
        }

  }

    static async getID(username: string) : Promise<UserID | ErrorDB>{
      try {
          const client = await KanbanDB.getClient();
          const data = await client.query(`SELECT id FROM users WHERE username = $1`, [username]);
          if (data.rows.length === 0) return { message: 'No se encontró una id para el usuario especificado', code:404} as ErrorDB
          return { id: data.rows[0][0] };

      } catch(e) { 
          console.log(e)
          const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500  };
          return error
        }
    }


    static async getAllUserSections(user_id: string): Promise<UserData | ErrorDB> {
        try {
          const client = await KanbanDB.getClient();
          let userdata: UserData = { sections: [] };
            const sections_id = await client.query(`SELECT title, id, position FROM section WHERE user_id = $1`, [user_id]);            
            for (const section of sections_id.rows) {
              const cards = await client.query(`SELECT id, title, content, position FROM cards WHERE section_id = $1`, [section[1]]);
              userdata.sections.push({ id: section[1], title: section[0], user_id: user_id, cards: cards.rows.map(card => ({ id: card[0], title: card[1], content: card[2], section_id: section[1], position:card[3] })), position:section[2] });
            }

            if (sections_id.rows.length === 0) return { message: 'No se encontró seccion para la id especificada', code:404} as ErrorDB
            return userdata
        } catch(e) {
          console.log(e)
          const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500  };
          return error
        }
    }


    static async getUserID(section_id: string) : Promise<UserID | ErrorDB>{
      try {
          const client = await KanbanDB.getClient();
          const data = await client.query(`SELECT user_id FROM section WHERE id = $1`, [section_id]);
          if (data.rows.length === 0) return { message: 'No se encontró seccion para la id especificada', code:404} as ErrorDB
          return { id: data.rows[0][0] };

      } catch(e) { 
          console.log(e)
          const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500  };
          return error
        }
    }

    static async getSectionID(card_id: string) : Promise<SectionID | ErrorDB>{
      try {
          const client = await KanbanDB.getClient();
          const data = await client.query(`SELECT section_id FROM cards WHERE id = $1`, [card_id]);
          if (data.rows.length === 0) return { message: 'No se encontró sección para la ID especificada', code:404} as ErrorDB
          return { id: data.rows[0][0] };

      } catch(e) { 
          console.log(e)
          const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500  };
          return error
        }
    }
   static async addSection(title: string, user_id: string, position: number): Promise<Section | ErrorDB> {
  try {
    const client = await KanbanDB.getClient();
    const data = await client.query(`INSERT INTO section (user_id, title, position) VALUES ($1, $2, $3) RETURNING *`, [user_id, title, position]);
    const section: Section = {
      id: data.rows[0][0].id,
      title: data.rows[0][0].title,
      user_id: data.rows[0][0].user_id,
      cards: [],
      position: data.rows[0][0].position
    };
    return section;
  } catch(e) {
    console.log(e);
    const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code: 500 };
    return error;
  }
}


    static async addCards(title: string, content: string, section_id: string, position: number): Promise<Card | ErrorDB> {
      try {
        const client = await KanbanDB.getClient();
        const data = await client.query(`INSERT INTO cards (title, content, section_id, position) VALUES ($1, $2, $3, $4) RETURNING *`, [title, content, section_id, position]);
        return { id: data.rows[0][0], title: data.rows[0][1], content: data.rows[0][2], section_id: data.rows[0][3], position: data.rows[0][4] };
      } catch (e) {
        console.log(e)
        const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500  };
        return error;
      }
    }

    static async addUser(username: string, hashedPasswd: string, email: string): Promise<User | ErrorDB>{
        try {
            const client = await KanbanDB.getClient();
            const data = await client.query(`INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *`, [username, hashedPasswd, email]);
            return { id: data.rows[0][0], username: data.rows[0][1], email: data.rows[0][2], password: data.rows[0][3] };
        } catch (e) {
          console.log(e)
          const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500  };
          return error;
        }
    }
    static async deleteSection(section_id: string): Promise<Section | ErrorDB>{
      try {
        const client = await KanbanDB.getClient();
        const data = await client.query(`DELETE FROM section WHERE id = $1 RETURNING *`, [section_id]);
        if (data.rows.length === 0) return { message: 'No se encontró la seccion', code:404} as ErrorDB
        const deletedCards = await client.query(`DELETE FROM cards WHERE section_id = $1 RETURNING *`, [section_id]);
        const cards = deletedCards.rows.map(card => ({ id: card[0], title: card[1], content: card[2], section_id: card[3], position: card[4] }));
        return { id: data.rows[0][0], title: data.rows[0][1], user_id: data.rows[0][2], cards: cards, position: data.rows[0][4]};
      } catch (e) {
        console.log(e)
        const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500  };
        return error;
      }
    }
    static async deleteCard(card_id: string): Promise<Card | ErrorDB> {
      try {
        const client = await KanbanDB.getClient();
        const data = await client.query(`DELETE FROM cards WHERE id = $1 RETURNING *`, [card_id]);
        if (data.rows.length === 0) return { message: 'No se encontró la carta', code:404} as ErrorDB
        return { id: data.rows[0][0], title: data.rows[0][1], content: data.rows[0][2], section_id: data.rows[0][3], position: data.rows[0][4] };
      } catch(e) { console.log(e);console.error(e); throw e; }
    }

    static async updateUser(user_id: string, { username, email, password }: { username?: string, email?: string, password?: string }): Promise<User | ErrorDB> {
      try {
        const client = await KanbanDB.getClient();
        const updates: string[] = [];
        const values: any[] = [];

        if (username) {
          updates.push('username = $1');
          values.push(username);
        }
        if (email) {
          updates.push('email = $2');
          values.push(email);
        }
        if (password) {
          updates.push('password = $3');
          values.push(await bcrypt.hash(password, 7));
        }

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length + 1}`;
        await client.query(query, [...values, user_id]);

        const data = await client.query('SELECT * FROM users WHERE id = $1', [user_id]);
        if (data.rows.length === 0) return { message: 'No se encontró el usuario especificado', code:404} as ErrorDB
        return { id: data.rows[0][0], username: data.rows[0][1], password: data.rows[0][2], email: data.rows[0][3] };
      } catch (e) {
        console.log(e)
        const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500  };
        return error;
      }
    }

    static async updateSection(section_id: string, { title, user_id, position }: { title?: string, user_id?: string, position?: number}): Promise<SectionInfo | ErrorDB> {
      try {
        const client = await KanbanDB.getClient();
        const updates: string[] = [];
        const values: any[] = [];

        if (title) {
          updates.push('title = $1');
          values.push(title);
        }
        if (user_id) {
          updates.push('user_id = $2');
          values.push(user_id);
        }

        if (position) {
          updates.push('position = $4');
          values.push(position);
        }

        const query = `UPDATE section SET ${updates.join(', ')} WHERE id = $${values.length + 1}`;
        await client.query(query, [...values, section_id]);

        const data = await client.query('SELECT * FROM section WHERE id = $1', [section_id]);
        if (data.rows.length === 0) return { message: 'No se encontró la seccion especificada', code:404} as ErrorDB
        return { id: data.rows[0][0], title: data.rows[0][1], user_id: data.rows[0][2], position: data.rows[0][4] };
      } catch (e) {
        console.log(e)
        const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500  };
        return error;
      }
    }

    static async updateCard(card_id: string, { title, content, section_id, position }: { title?: string, content?: string, section_id?: string, position?:number }): Promise<Card | ErrorDB> {
      try {
        const client = await KanbanDB.getClient();
        const updates: string[] = [];
        const values: any[] = [];

        if (title) {
          updates.push('title = $1');
          values.push(title);
        }
        if (content) {
          updates.push('content = $2');
          values.push(content);
        }
        if (section_id) {
          updates.push('section_id = $3');
          values.push(section_id);
        }

        if (position) {
          updates.push('position = $3');
          values.push(position);
        }

        const query = `UPDATE cards SET ${updates.join(', ')} WHERE id = $${values.length + 1}`;
        await client.query(query, [...values, card_id]);

        const data = await client.query('SELECT * FROM cards WHERE id = $1', [card_id]);
        if (data.rows.length === 0) return { message: 'No se encontró el usuario especificado', code:404} as ErrorDB
        return { id: data.rows[0][0], title: data.rows[0][1], content: data.rows[0][2], section_id: data.rows[0][3], position: data.rows[0][4]};
      } catch (e) {
        console.log(e)
        const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500  };
        return error;
      }
    }

    static async getUserInfo(user_id: string) : Promise<UserInfo | ErrorDB>{
      try {
          const client = await KanbanDB.getClient();
          const data = await client.query(`SELECT username, email FROM users WHERE id = $1`, [user_id]);
          if (data.rows.length === 0) return { message: 'No se encontró un usuario para el id especificado', code:404} as ErrorDB
          return { username: data.rows[0][0], email: data.rows[0][1] };

      } catch(e) { 
          console.log(e)
          const error: ErrorDB = { message: 'Error en la base de datos: ' + (e as Error).message, code:500  };
          return error
        }
    }


}

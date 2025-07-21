import app from './app';
import { sequelize } from './config/databases';

const PORT = process.env.PORT || 8000;

async function startServer() {
    try{
        await sequelize.authenticate();
        console.log("Databases Terhubung");
        app.listen(PORT,() =>{
            console.log(`Server Berjalan bosquh!`)
        })
    }catch(error){
        console.error('Unable to Connect (databases tidak terhubung)',error);
    }
}

startServer();
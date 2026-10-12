import app from './app';
import { sequelize } from './config/databases';
import { mulaiPoller } from './services/antrian/poller';

const PORT = process.env.PORT || 8000;

async function startServer() {
    try{
        await sequelize.authenticate();
        console.log("Databases Terhubung");
        mulaiPoller();
        app.listen(PORT,() =>{
            console.log(`Server Berjalan bosquh!`)
        })
    }catch(error){
        console.error('Unable to Connect (databases tidak terhubung)',error);
    }
}

startServer();
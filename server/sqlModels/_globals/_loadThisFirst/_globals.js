
import Sequelize from 'sequelize';

const sequelize = new Sequelize(Meteor.settings.sqlServer_db_contab_dbName,
                                Meteor.settings.sqlServer_db_contab_userName,
                                Meteor.settings.sqlServer_db_contab_userPwd, {
    // the sql dialect of the database
    // currently supported: 'mysql', 'sqlite', 'postgres', 'mssql'
    dialect: 'mssql',
  
    // custom host; default: localhost
    host: Meteor.settings.sqlServer_db_contab_host,
  
    // custom port; default: dialect default
    port: Meteor.settings.sqlServer_db_contab_port,
  
    // pool configuration used to pool database connections
    pool: {
        maxConnections: 50,
        minConnections: 0,
        maxIdleTime: 60000
      },

      define: {
        timestamps: false // true by default; para que sequelize no agregue timestaps en forma automática
      },
      dialectOptions: {
        requestTimeout: 30000
      }
})

const datosConexionSqlServer = `${Meteor.settings.sqlServer_db_contab_host}:${Meteor.settings.sqlServer_db_contab_port} ${Meteor.settings.sqlServer_db_contab_dbName} ${Meteor.settings.sqlServer_db_contab_userName}`; 
console.log("Intentando una conexión a sql server: ", datosConexionSqlServer); 

// -------------------------------------------------------------------------------------------------------------
var sqlConnection = Async.runSync(function(done) {
  var test = sequelize.authenticate().then(function () { done(null, "conexión exitosa a sql server ..."); })
                                      .catch(function (err) { done(err, null); })
                                      .done();
});

if (sqlConnection.error) {
  // sequelize no pudo conectarse a sql server en forma exitosa
  console.log("Oops, se ha obtenido un error al intentar la conexión a sql server ..."); 
  throw new Meteor.Error(sqlConnection.error && sqlConnection.error.message ? sqlConnection.error.message : sqlConnection.error.toString());
}

console.log("Ok, la conexión a sql server ha sido exitosa! ..."); 

export { sequelize };
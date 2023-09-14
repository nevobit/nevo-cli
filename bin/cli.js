import inquirer from 'inquirer';
import gitClone from 'git-clone';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Obtener la ruta del archivo actual
const __filename = new URL(import.meta.url).pathname;

// Convertir la ruta a un formato de sistema de archivos
const __dirname = path.dirname(__filename);


const templates = {
    ReactJs: 'https://github.com/nevobit/react-typescript-template.git',
    RushMonorepo: 'https://github.com/nevobit/rush-monorepo-template.git'
};

const commands = process.argv.slice(2); // Obtiene los comandos ingresados después de "nevo"
let selectedProject = commands[1]; // Obtén el tipo de proyecto del primer argumento
let projectName = commands[2]; // Obtén el nombre del proyecto del segundo argumento

const questions = [
    {
        type: 'list',
        name: 'projectType',
        message: 'What project do you want to start?',
        choices: ['NextJs', 'ReactJs', 'RushMonorepo', 'Turbo Monorepo', 'React Native', 'Node-Express Api', 'Node-Fastify Api', 'Node-Graphql Api'], // Añade más opciones si es necesario
        default: 'ReactJs'
    },
    {
        type: 'input',
        name: 'projectName',
        message: 'Enter a name for your project:',
        validate: (input) => {
            return input.trim() !== '' ? true : 'Please enter a project name';
        }
    }
];

const createProject = (selectedProject, projectName) => {
    const templateRepoURL = templates[selectedProject];
    const cloneDirectory = path.join(__dirname, projectName);
    console.log(cloneDirectory)

    console.log(`You selected: ${selectedProject}`);
    console.log(`Project name: ${projectName}`);

    gitClone(templateRepoURL, cloneDirectory, {}, (err) => {
        if (err) {
            console.error('Error cloning repository:', err);
            return;
        }

        console.log('Repository cloned successfully');

        // Ejecutar el script bash personalizado para Rush Monorepo
        if (selectedProject === 'RushMonorepo') {
            const rushScriptPath = path.join(__dirname, 'rush-script.sh');
            try {
                execSync(`bash ${rushScriptPath} "${projectName}"`, { cwd: cloneDirectory, stdio: 'inherit' });
            } catch (error) {
                console.error('Error running custom script:', error);
            }
        } else {
            try {
               // Actualizar package.json con el nombre del proyecto
                const packageJsonPath = path.join(cloneDirectory, 'package.json');
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                packageJson.name = projectName;
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                console.log(`package.json updated with ${projectName}`);
                // Instalar dependencias para otros tipos de proyectos con pnpm
                execSync('pnpm install', { cwd: cloneDirectory, stdio: 'inherit' });
                console.log('Dependencies installed successfully');
            } catch (error) {
                console.error('Error installing dependencies:', error);
            }
        }
    });
};


// Si no se proporcionan suficientes argumentos o no es "init", realiza preguntas interactivas
if (commands.length < 2 || commands[0] !== 'init') {
    inquirer.prompt(questions).then(answers => {
        selectedProject = answers.projectType;
        projectName = answers.projectName;
        createProject(selectedProject, projectName);
    });
} else {
    createProject(selectedProject, projectName);
}


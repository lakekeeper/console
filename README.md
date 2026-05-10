# Lakekeeper Console: A UI for Lakekeeper

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge&logo=discord&logoColor=white)](https://opensource.org/licenses/Apache-2.0)
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/jkAGG8p93B)

## Description

This project provides a user interface for the Lakekeeper REST catalog, designed to manage Apache Iceberg tables. It offers an intuitive and efficient way to interact with the catalog, simplifying the management of large datasets and supporting various data operations. The interface also facilitates fine-grained authorization, enabling users and roles to access system objects such as projects, warehouses, namespaces, tables, and views.

<img src="src/assets/homepage.png" alt="Lakekeeper UI" width="400px">
<br>
<img src="src/assets/warehouse.png" alt="Lakekeeper UI" width="400px">
<br>
<img src="src/assets/branch_table.png" alt="Lakekeeper UI" width="400px">
<br>
<img src="src/assets/view_history.png" alt="Lakekeeper UI" width="400px">
<br>
<img src="src/assets/tasks_wh.png" alt="Lakekeeper UI" width="400px">

## Table of Contents

- [Lakekeeper Console: A UI for Lakekeeper](#lakekeeper-console-a-ui-for-lakekeeper)
  - [Description](#description)
  - [Table of Contents](#table-of-contents)
  - [Prerequites](#prerequites)
  - [Installation UI](#installation-ui)
  - [Usage](#usage)
  - [In-app feedback surveys](#in-app-feedback-surveys)
  - [Contributing](#contributing)
  - [License](#license)

## Prerequites

To set up this project, ensure you have the following:

- PostgresDB:

```bash
docker rm --force postgres-16 && docker run -d --name postgres-16 -p 5432:5432 -e POSTGRES_PASSWORD=postgres  postgres:16.4 -c "max_connections=10000"
```

- OpenFGA: For fine-grained authorization.

```bash
docker rm --force openfga && docker run -d --name openfga -p 35080:8080 -p 35081:8081 -p 35300:3000 openfga/openfga run
```

- Identity Provider (IdP): For example, Keycloak or a similar solution. (see example https://github.com/lakekeeper/lakekeeper/tree/main/examples)
- Lakekeeper REST Catalog: Follow the setup instructions [here](https://github.com/lakekeeper/lakekeeper).

## Installation UI

Step-by-step instructions on how to get the development environment running.

```bash
# Clone the repository
git clone https://github.com/lakekeeper/console

# Navigate to the project directory
cd console

# Install dependencies
npm install
```

## Usage

Instructions and examples for using your project.

```
# Run the application
npm run dev
```

## In-app feedback surveys

The console can show occasional, dismissible in-app surveys to help us understand how people use Lakekeeper and what to build next. We use [Formbricks](https://formbricks.com) (Formbricks Cloud) for this.

**What is sent**

- An anonymous, randomly generated user ID created locally by the SDK (no email, no IP-based tracking by us, no warehouse/namespace/table names)
- The action key that triggered a survey (e.g. `warehouse_viewed`) and a timestamp
- Survey responses, **only when a user voluntarily answers**

**What is _not_ sent**

- Catalog contents (warehouses, namespaces, tables, columns, queries)
- Authentication tokens or user profile data
- Any field that could identify the deployment beyond the SDK's anonymous ID

**How to disable**

Set `LAKEKEEPER__UI__ENABLE_USER_SURVEYS=false` (or `VITE_ENABLE_USER_SURVEYS=false` if building from source). When disabled, the Formbricks SDK is not initialized and no third-party requests are made.

## Contributing

This app uses [@lakekeeper/console-components](https://github.com/lakekeeper/console-components) as its shared component library. For the full contributing guide — including local development setup, linking the library, and starting the backend — see:

**[console-components/CONTRIBUTING.md](https://github.com/lakekeeper/console-components/blob/main/CONTRIBUTING.md)**

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

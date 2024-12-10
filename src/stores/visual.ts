// Utilities
import { defineStore } from 'pinia';
import { Project, SnackbarMsg, Type } from '@/common/interfaces';
import { ServerInfo } from '@/gen//management/types.gen';

export const useVisualStore = defineStore(
  'visual',
  () => {
    const currentUrl = ref('');
    const showAppOrNavBar = ref(true);
    const themeLight = ref(true);
    const navBarShow = ref(true);
    const whId = ref('');
    const wahrehouseName = ref('');
    const namespacePath = ref('');
    const projectInfo = reactive<ServerInfo>({
      version: '0.0.0',
      bootstrapped: true,
      'server-id': '00000000-0000-0000-0000-000000000000',
      'default-project-id': '00000000-0000-0000-0000-000000000000',
      'authz-backend': 'allow-all',
    });

    const projectSelected = reactive<Project>({
      'project-id': '0',
      'project-name': 'none',
    });

    const snackbarMsg = reactive<SnackbarMsg>({
      text: '',
      ttl: 0,
      ts: 0,
      type: Type.ERROR,
    });

    const projectList = reactive<Project[]>([]);

    function toggleThemeLight() {
      themeLight.value = !themeLight.value;
    }

    function navBarSwitch() {
      navBarShow.value = !navBarShow.value;
    }

    function setProjectCatalog(projectCatalog: ServerInfo) {
      Object.assign(projectInfo, projectCatalog);
    }
    function setProject(p: Project) {
      Object.assign(projectInfo, p);
    }

    function setProjectList(p: Project[]) {
      Object.assign(projectList, p);
    }

    function setSnackbarMsg(msg: SnackbarMsg) {
      Object.assign(snackbarMsg, msg);
    }

    function getSnackbarMsg() {
      return snackbarMsg;
    }

    return {
      currentUrl,
      showAppOrNavBar,
      whId,
      wahrehouseName,
      namespacePath,
      themeLight,
      navBarShow,
      projectInfo,
      projectList,
      projectSelected,
      snackbarMsg,
      toggleThemeLight,
      setProjectList,
      navBarSwitch,
      setProjectCatalog,
      setProject,
      setSnackbarMsg,
      getSnackbarMsg,
    };
  },
  {
    persistedState: {
      key: 'visual',
      persist: true,
    },
  },
);

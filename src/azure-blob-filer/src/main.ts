import { createApp } from 'vue';
import i18n from './i18n';
import App from './App.vue';
import router from './router';

import PrimeVue from 'primevue/config';
import Breadcrumb from 'primevue/breadcrumb';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Menubar from 'primevue/menubar';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import Tree from 'primevue/tree';
import TreeTable from 'primevue/treetable';

import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.min.css';
import './assets/main.scss';

const app = createApp(App);

app.use(i18n);
app.use(router);
app.use(PrimeVue);

app.component('Breadcrumb', Breadcrumb);
app.component('Column', Column);
app.component('DataTable', DataTable);
app.component('Menubar', Menubar);
app.component('Splitter', Splitter);
app.component('SplitterPanel', SplitterPanel);
app.component('Tree', Tree);
app.component('TreeTable', TreeTable);

app.mount('#app');

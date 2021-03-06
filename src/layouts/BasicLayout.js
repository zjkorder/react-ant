import React, { Suspense } from 'react';
import router from 'umi/router';
import { Layout,Tabs } from 'antd';
import DocumentTitle from 'react-document-title';
import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import { connect } from 'dva';
import { ContainerQuery } from 'react-container-query';
import classNames from 'classnames';
import pathToRegexp from 'path-to-regexp';
import Media from 'react-media';
import { formatMessage } from 'umi/locale';
import Authorized from '@/utils/Authorized';
import logo from '../assets/logo.svg';
import Footer from './Footer';
import Header from './Header';
import Context from './MenuContext';
import Exception403 from '../pages/Exception/403';
import Home from '../pages/Home/Home';
import PageLoading from '@/components/PageLoading';
import SiderMenu from '@/components/SiderMenu';
import styles from './BasicLayout.less';

// lazy load SettingDrawer
const SettingDrawer = React.lazy(() => import('@/components/SettingDrawer'));

const { Content } = Layout;
const { TabPane } = Tabs;
const query = {
  'screen-xs': {
    maxWidth: 575,
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767,
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991,
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199,
  },
  'screen-xl': {
    minWidth: 1200,
    maxWidth: 1599,
  },
  'screen-xxl': {
    minWidth: 1600,
  },
};

class BasicLayout extends React.PureComponent {
  constructor(props) {
    super(props);
      this.state = ({
          tabList:[{closable: false,key: "/home/home",tab: "首页",content: <Home/>,locale:"menu.home"}],
        tabListKey:[],
        activeKey:'/dashboard/workplace',
        activeRemove: false
    })

    this.getPageTitle = memoizeOne(this.getPageTitle);
    this.matchParamsPath = memoizeOne(this.matchParamsPath, isEqual);
  }

  componentDidMount() {
    const {
      dispatch,
      route: { routes, authority },
    } = this.props;
    dispatch({
      type: 'user/fetchCurrent',
    });
    dispatch({
      type: 'setting/getSetting',
    });
    dispatch({
      type: 'menu/getMenuData',
      payload: { routes, authority },
    });
  }

  componentDidUpdate(preProps) {
    // After changing to phone mode,
    // if collapsed is true, you need to click twice to display
    const { collapsed, isMobile } = this.props;
    if (isMobile && !preProps.isMobile && !collapsed) {
      this.handleMenuCollapse(false);
    }
  }

  getContext() {
    const { location, breadcrumbNameMap } = this.props;
    return {
      location,
      breadcrumbNameMap,
    };
  }

  matchParamsPath = (pathname, breadcrumbNameMap) => {
    const pathKey = Object.keys(breadcrumbNameMap).find(key => pathToRegexp(key).test(pathname));
    return breadcrumbNameMap[pathKey];
  };

  getRouterAuthority = (pathname, routeData) => {
    let routeAuthority = ['noAuthority'];
    const getAuthority = (key, routes) => {
      routes.map(route => {
        if (route.path && pathToRegexp(route.path).test(key)) {
          routeAuthority = route.authority;
        } else if (route.routes) {
          routeAuthority = getAuthority(key, route.routes);
        }
        return route;
      });
      return routeAuthority;
    };
    return getAuthority(pathname, routeData);
  };

  getPageTitle = (pathname, breadcrumbNameMap) => {
    const currRouterData = this.matchParamsPath(pathname, breadcrumbNameMap);

    if (!currRouterData) {
      return 'Ant Design Pro';
    }
    const pageName = formatMessage({
      id: currRouterData.locale || currRouterData.name,
      defaultMessage: currRouterData.name,
    });

    return `${pageName} - Ant Design Pro`;
  };

  getLayoutStyle = () => {
    const { fixSiderbar, isMobile, collapsed, layout } = this.props;
    if (fixSiderbar && layout !== 'topmenu' && !isMobile) {
      return {
        paddingLeft: collapsed ? '80px' : '256px',
      };
    }
    return null;
  };

  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: collapsed,
    });
  };

  renderSettingDrawer = () => {
    // Do not render SettingDrawer in production
    // unless it is deployed in preview.pro.ant.design as demo
    if (process.env.NODE_ENV === 'production' && APP_TYPE !== 'site') {
      return null;
    }
    return <SettingDrawer />;
  };

    onPrevClick = (e)=>{
        console.log(e)
    }

    // 切换 tab页 router.push(key);
    onChange = key => {
        this.setState({ activeKey:key });
        router.push(key)
    };

    onEdit = (targetKey, action) => {
        this[action](targetKey);
    }

    remove = (targetKey) => {
        let {activeKey,activeRemove} = this.state;
        let lastIndex;
        this.state.tabList.forEach((pane, i) => {
            if (pane.key === targetKey) {
                lastIndex = i - 1;
            }
        });
        const tabList = []
        this.state.tabList.map(pane => {
          if(pane.key !== targetKey){
              tabList.push(pane)
          }
        });
        if (lastIndex >= 0 && activeKey === targetKey) {
            activeKey = tabList[lastIndex].key;
            activeRemove = true
        }else{
            activeRemove = false
        }
        router.push(activeKey)
        this.setState({ tabList, activeKey,activeRemove });
    }

    updateTreeList = data => {
        const treeData = data;
        const treeList = [];
        // 递归获取树列表
        const getTreeList = data => {
            data.forEach(node => {
              if(!node.level){
                  treeList.push({ tab: node.name, key: node.path,locale:node.locale,closable:true,content:'' });
              }
                if (!node.hideChildrenInMenu && node.children && node.children.length > 0) {
                    getTreeList(node.children);
                }
            });
        };
        getTreeList(treeData);
        return treeList;
    };


  render() {


    const {
      navTheme,
      layout: PropsLayout,
      children,
      location: { pathname },
      isMobile,
      menuData,
      breadcrumbNameMap,
      route: { routes },
      fixedHeader,
      location
    } = this.props;

      console.log(this);
    const tabLists = this.updateTreeList(menuData);
    const {tabListKey,tabList,activeRemove} =  this.state
    this.setState({ activeKey:location.pathname });
      tabLists.map((v) => {
          if(v.key == location.pathname && !activeRemove){
              v.content = children
              if(tabList.length == 0){
                  v.closable = false
                  this.state.tabList.push(v)
              }else{
                  if(!tabListKey.includes(v.key)){
                      this.state.tabList.push(v)
                  }
              }
          }
      })

      if(location.pathname == '/'){
          router.push('/home/home')
      }
      this.setState({ activeRemove:false });
      this.state.tabListKey = tabList.map((va)=>va.key)
      const isTop = PropsLayout === 'topmenu';
     const routerConfig = this.getRouterAuthority(pathname, routes);
    const contentStyle = !fixedHeader ? { paddingTop: 0 } : {};
    const layout = (
      <Layout>
        {isTop && !isMobile ? null : (
          <SiderMenu
            logo={logo}
            theme={navTheme}
            onCollapse={this.handleMenuCollapse}
            menuData={menuData}
            isMobile={isMobile}
            {...this.props}
          />
        )}
        <Layout
          style={{
            ...this.getLayoutStyle(),
            minHeight: '100vh',
          }}
        >
          <Header
            menuData={menuData}
            handleMenuCollapse={this.handleMenuCollapse}
            logo={logo}
            isMobile={isMobile}
            {...this.props}
          />
          <Content className={styles.content} style={contentStyle}>
              {/*<Authorized authority={routerConfig} noMatch={<Exception403 />}>*/}
                  {/*{children}*/}
              {/*</Authorized>*/}
                  {this.state.tabList && this.state.tabList.length ? (
                      <Tabs
                          // className={styles.tabs}
                          activeKey={this.state.activeKey}
                          onChange={this.onChange}
                          onPrevClick = {this.onPrevClick}
                          // tabBarExtraContent={}
                          tabBarStyle={{background:'#fff'}}
                          tabPosition="top"
                          tabBarGutter={-1}
                          hideAdd
                          type="editable-card"
                          onEdit={this.onEdit}
                      >
                          {this.state.tabList.map(item => (
                              <TabPane tab={item.tab} key={item.key} closable={item.closable}>{item.content}</TabPane>
                          ))}
                      </Tabs>
                  ) : null}
          </Content>
          <Footer />
        </Layout>
      </Layout>
    );
    return (
      <React.Fragment>
        <DocumentTitle title={this.getPageTitle(pathname, breadcrumbNameMap)}>
          <ContainerQuery query={query}>
            {params => (
              <Context.Provider value={this.getContext()}>
                <div className={classNames(params)}>{layout}</div>
              </Context.Provider>
            )}
          </ContainerQuery>
        </DocumentTitle>
        <Suspense fallback={<PageLoading />}>{this.renderSettingDrawer()}</Suspense>
      </React.Fragment>
    );
  }
}

export default connect(({ global, setting, menu }) => ({
  collapsed: global.collapsed,
  layout: setting.layout,
  menuData: menu.menuData,
  breadcrumbNameMap: menu.breadcrumbNameMap,
  ...setting,
}))(props => (
  <Media query="(max-width: 599px)">
    {isMobile => <BasicLayout {...props} isMobile={isMobile} />}
  </Media>
));

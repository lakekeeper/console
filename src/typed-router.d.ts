/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'vue-router'

  /**
   * Route name map generated by unplugin-vue-router
   */
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>,
    '/about': RouteRecordInfo<'/about', '/about', Record<never, never>, Record<never, never>>,
    '/bootstrap': RouteRecordInfo<'/bootstrap', '/bootstrap', Record<never, never>, Record<never, never>>,
    '/callback': RouteRecordInfo<'/callback', '/callback', Record<never, never>, Record<never, never>>,
    '/license': RouteRecordInfo<'/license', '/license', Record<never, never>, Record<never, never>>,
    '/login': RouteRecordInfo<'/login', '/login', Record<never, never>, Record<never, never>>,
    '/logout': RouteRecordInfo<'/logout', '/logout', Record<never, never>, Record<never, never>>,
    '/notfound': RouteRecordInfo<'/notfound', '/notfound', Record<never, never>, Record<never, never>>,
    '/roles/': RouteRecordInfo<'/roles/', '/roles', Record<never, never>, Record<never, never>>,
    '/roles/[id]': RouteRecordInfo<'/roles/[id]', '/roles/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/server-offline': RouteRecordInfo<'/server-offline', '/server-offline', Record<never, never>, Record<never, never>>,
    '/server-settings': RouteRecordInfo<'/server-settings', '/server-settings', Record<never, never>, Record<never, never>>,
    '/user-profile': RouteRecordInfo<'/user-profile', '/user-profile', Record<never, never>, Record<never, never>>,
    '/warehouse/': RouteRecordInfo<'/warehouse/', '/warehouse', Record<never, never>, Record<never, never>>,
    '/warehouse/[id]': RouteRecordInfo<'/warehouse/[id]', '/warehouse/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/warehouse/[id].namespace.[nsid]': RouteRecordInfo<'/warehouse/[id].namespace.[nsid]', '/warehouse/:id/namespace/:nsid', { id: ParamValue<true>, nsid: ParamValue<true> }, { id: ParamValue<false>, nsid: ParamValue<false> }>,
    '/warehouse/[id].namespace.[nsid].table.[tid]': RouteRecordInfo<'/warehouse/[id].namespace.[nsid].table.[tid]', '/warehouse/:id/namespace/:nsid/table/:tid', { id: ParamValue<true>, nsid: ParamValue<true>, tid: ParamValue<true> }, { id: ParamValue<false>, nsid: ParamValue<false>, tid: ParamValue<false> }>,
    '/warehouse/[id].namespace.[nsid].view.[vid]': RouteRecordInfo<'/warehouse/[id].namespace.[nsid].view.[vid]', '/warehouse/:id/namespace/:nsid/view/:vid', { id: ParamValue<true>, nsid: ParamValue<true>, vid: ParamValue<true> }, { id: ParamValue<false>, nsid: ParamValue<false>, vid: ParamValue<false> }>,
  }
}

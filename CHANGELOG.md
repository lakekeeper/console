# Changelog

## [0.11.2](https://github.com/lakekeeper/console/compare/v0.11.1...v0.11.2) (2026-01-29)


### Bug Fixes

* duckdb attach catalog improvements ([#189](https://github.com/lakekeeper/console/issues/189)) ([e445a31](https://github.com/lakekeeper/console/commit/e445a31aa0fefb100e15e3b8c241deb43fe468e0))

## [0.11.1](https://github.com/lakekeeper/console/compare/v0.11.0...v0.11.1) (2026-01-06)


### Bug Fixes

* Remove dependency on unmaintained lib derivative ([52f79cc](https://github.com/lakekeeper/console/commit/52f79cccebba1b0e9d69b2be0f28250bf338e175))
* rust build script should not copy target ([#184](https://github.com/lakekeeper/console/issues/184)) ([2734b52](https://github.com/lakekeeper/console/commit/2734b5220c328b4e004ca6fbd602f8a9aa6c6b3f))

## [0.11.0](https://github.com/lakekeeper/console/compare/v0.10.3...v0.11.0) (2026-01-01)


### Miscellaneous Chores

* component logic ([#168](https://github.com/lakekeeper/console/issues/168)) ([233a866](https://github.com/lakekeeper/console/commit/233a8664035e7d15750467966309370c5824edc0))

## [0.10.3](https://github.com/lakekeeper/console/compare/v0.10.2...v0.10.3) (2025-10-28)


### Bug Fixes

* create s3 with aws identity ([#171](https://github.com/lakekeeper/console/issues/171)) ([69a918c](https://github.com/lakekeeper/console/commit/69a918cf20a3cb8d32fe1ced00b89be62fbb76fe))

## [0.10.2](https://github.com/lakekeeper/console/compare/v0.10.1...v0.10.2) (2025-10-05)


### Features

* filter warehouses ([#166](https://github.com/lakekeeper/console/issues/166)) ([1e1078c](https://github.com/lakekeeper/console/commit/1e1078cb81e748b997a76102ffd79bff210fc5a6))


### Bug Fixes

* user pagination and search ([#164](https://github.com/lakekeeper/console/issues/164)) ([4221f1c](https://github.com/lakekeeper/console/commit/4221f1c2e33eb8d803cd7d756242cb72413c90e0))


### Miscellaneous Chores

* release 0.10.1 ([600666c](https://github.com/lakekeeper/console/commit/600666cc6554918e9df128cabf47480e1863caa1))
* release 0.10.2 ([32198a0](https://github.com/lakekeeper/console/commit/32198a0f71b21a9feaf34870744d2900e3bc2df6))

## [0.10.1](https://github.com/lakekeeper/console/compare/v0.10.1...v0.10.1) (2025-10-03)


### Features

* filter warehouses ([#166](https://github.com/lakekeeper/console/issues/166)) ([1e1078c](https://github.com/lakekeeper/console/commit/1e1078cb81e748b997a76102ffd79bff210fc5a6))


### Bug Fixes

* user pagination and search ([#164](https://github.com/lakekeeper/console/issues/164)) ([4221f1c](https://github.com/lakekeeper/console/commit/4221f1c2e33eb8d803cd7d756242cb72413c90e0))


### Miscellaneous Chores

* release 0.10.1 ([600666c](https://github.com/lakekeeper/console/commit/600666cc6554918e9df128cabf47480e1863caa1))

## [0.10.1](https://github.com/lakekeeper/console/compare/v0.10.0...v0.10.1) (2025-09-29)


### Bug Fixes

* UI added entity name ([#162](https://github.com/lakekeeper/console/issues/162)) ([b72f1bf](https://github.com/lakekeeper/console/commit/b72f1bf0a44cb78539db338856394e7128a2a828))

## [0.10.0](https://github.com/lakekeeper/console/compare/v0.9.0...v0.10.0) (2025-09-28)


### Features

* add Task Manager with filtering, pagination, and task actions ([761e842](https://github.com/lakekeeper/console/commit/761e8422082c80b060b5524ad53c700258574c8b))
* **insights:** add Table Details and Branch Visualization ([761e842](https://github.com/lakekeeper/console/commit/761e8422082c80b060b5524ad53c700258574c8b))
* **insights:** add View Details and View History with rich timelines ([761e842](https://github.com/lakekeeper/console/commit/761e8422082c80b060b5524ad53c700258574c8b))
* search tables and vie inside warehouse ([#161](https://github.com/lakekeeper/console/issues/161)) ([481a201](https://github.com/lakekeeper/console/commit/481a201cd52f4f6abefdd1879ce191a81960cc0e))
* **tasks:** add task tabs to warehouse, table, and view pages ([761e842](https://github.com/lakekeeper/console/commit/761e8422082c80b060b5524ad53c700258574c8b))
* **tasks:** implement per-warehouse queue configuration with friendly naming ([761e842](https://github.com/lakekeeper/console/commit/761e8422082c80b060b5524ad53c700258574c8b))
* **ui:** add copy-to-clipboard for JSON data in tables and views ([761e842](https://github.com/lakekeeper/console/commit/761e8422082c80b060b5524ad53c700258574c8b))
* **warehouse:** add STS Session Tags editor for S3 configuration ([761e842](https://github.com/lakekeeper/console/commit/761e8422082c80b060b5524ad53c700258574c8b))


### Bug Fixes

* **console-rs:** correct path to node build artifacts ([#155](https://github.com/lakekeeper/console/issues/155)) ([64dc2e6](https://github.com/lakekeeper/console/commit/64dc2e632ab3762517064c4dc925c1699d5392f7))
* tasks access ([#156](https://github.com/lakekeeper/console/issues/156)) ([be83bfa](https://github.com/lakekeeper/console/commit/be83bfa3493099ffd14652f50414d8536e77f4ca))
* **ui:** improve gesture handling to prevent accidental navigation on macOS/Safari ([761e842](https://github.com/lakekeeper/console/commit/761e8422082c80b060b5524ad53c700258574c8b))

## [0.9.0](https://github.com/lakekeeper/console/compare/v0.8.0...v0.9.0) (2025-08-06)


### Features

* add multi project support ([#145](https://github.com/lakekeeper/console/issues/145)) ([26d70fe](https://github.com/lakekeeper/console/commit/26d70fe56d00fb484aabff01403d75c6100e9e0a))


### Bug Fixes

* publish build ([6222b60](https://github.com/lakekeeper/console/commit/6222b60c35fd1622d20fb654b93dfdfdfa9f72fe))

## [0.8.0](https://github.com/lakekeeper/console/compare/v0.7.0...v0.8.0) (2025-06-15)


### Features

* Add new warehouse as json object ([#126](https://github.com/lakekeeper/console/issues/126)) ([5fd4c92](https://github.com/lakekeeper/console/commit/5fd4c922a69e22d1d4be2be70ad4050a04fd3d9a))
* Support UI beeing hosted with a prefix in the URL path ([#140](https://github.com/lakekeeper/console/issues/140)) ([bb0cc91](https://github.com/lakekeeper/console/commit/bb0cc913519977436b2e6e85a9ae622936051510))
* use different token for authentication  ([#141](https://github.com/lakekeeper/console/issues/141)) ([446a341](https://github.com/lakekeeper/console/commit/446a341a8318c4ed309632da559a00b87531148a))


### Bug Fixes

* assign permissions ([#130](https://github.com/lakekeeper/console/issues/130)) ([e250484](https://github.com/lakekeeper/console/commit/e25048477f1896ce608ba5a3bfeef7268655c30e))
* big int represented as string([#125](https://github.com/lakekeeper/console/issues/125)) ([ffeb188](https://github.com/lakekeeper/console/commit/ffeb18850ec5fd7fe0db25d1e17858af3a91bf2d))
* rename switch field push-s3-delete-disabled ([#131](https://github.com/lakekeeper/console/issues/131)) ([9cf6414](https://github.com/lakekeeper/console/commit/9cf64142784f996079e943d91cadee0330031d45))
* role owner can delete role ([#139](https://github.com/lakekeeper/console/issues/139)) ([e7d42ce](https://github.com/lakekeeper/console/commit/e7d42cec8ae5f87618ec427ce2a7fabe98c59468))
* Typo for recursive deletion ([e3b6dc8](https://github.com/lakekeeper/console/commit/e3b6dc81212a60e1354b1b9d5da8374b98828be5))
* wrong data type of sts-token-validity-seconds and S3 update profile ([#134](https://github.com/lakekeeper/console/issues/134)) ([7d41a48](https://github.com/lakekeeper/console/commit/7d41a4871631b6ca24613d2f874845e7fd91b6e1))

## [0.7.0](https://github.com/lakekeeper/console/compare/v0.6.0...v0.7.0) (2025-04-13)


### Features

* GCP & Azure System Identities, Delete Options ([#114](https://github.com/lakekeeper/console/issues/114)) ([#114](https://github.com/lakekeeper/console/issues/114)) ([5cca272](https://github.com/lakekeeper/console/commit/5cca272ebccd673c5f3ed9a69a77227c78b1019c))


### Bug Fixes

* added project statistics if auth is off ([#110](https://github.com/lakekeeper/console/issues/110)) ([c38c0cf](https://github.com/lakekeeper/console/commit/c38c0cf8f2c9851a8e5d104c6eaf6d056ad62d73))
* **deps:** update dependency @wdns/vue-code-block to v2.3.5 ([#61](https://github.com/lakekeeper/console/issues/61)) ([f75a544](https://github.com/lakekeeper/console/commit/f75a544fb1533defd4b1f07df1cb0a76f162e00d))
* **deps:** update dependency pinia-plugin-persistedstate-2 to v2.0.30 ([#115](https://github.com/lakekeeper/console/issues/115)) ([84312b8](https://github.com/lakekeeper/console/commit/84312b8ea2e61b3f324f4d18d45630eb37220441))

## [0.6.0](https://github.com/lakekeeper/console/compare/v0.5.0...v0.6.0) (2025-04-07)


### Features

* AppBar help button ([#100](https://github.com/lakekeeper/console/issues/100)) ([e0fb0f4](https://github.com/lakekeeper/console/commit/e0fb0f43195657f1271e38613e96b597c42e438a))
* **az:** add shared key auth for azure ([#94](https://github.com/lakekeeper/console/issues/94)) ([0e2a548](https://github.com/lakekeeper/console/commit/0e2a5482b3a21c7b148cf013d1f497ec0cacd453))
* expand and collapse raw iceberg table representation ([#98](https://github.com/lakekeeper/console/issues/98)) ([c32b19f](https://github.com/lakekeeper/console/commit/c32b19fafd52b7b7692f37046cdf09cc2862c657))
* Update OpenAPI, Add assume-role-arn, Add S3 System Identities  ([#106](https://github.com/lakekeeper/console/issues/106)) ([4a0e707](https://github.com/lakekeeper/console/commit/4a0e7077dbad236e2ef3c7cdbc37c097a3d7474b))
* warehouse and project statistics ([#109](https://github.com/lakekeeper/console/issues/109)) ([4a32d6e](https://github.com/lakekeeper/console/commit/4a32d6e2fca4a80e1fb7bd91a3ff83cc92216dcf))


### Bug Fixes

* spelling ([#99](https://github.com/lakekeeper/console/issues/99)) ([277e6f0](https://github.com/lakekeeper/console/commit/277e6f0884e8dbcf3e17071368ca8f4e6d1c378d))
* Storage Profile required fields for S3-compat storage ([#105](https://github.com/lakekeeper/console/issues/105)) ([036dddd](https://github.com/lakekeeper/console/commit/036dddd01dec7c34ca4bf05852fae034a57a6f74))
* text and PyIceberg connect option ([#97](https://github.com/lakekeeper/console/issues/97)) ([e8426f0](https://github.com/lakekeeper/console/commit/e8426f02c3c924d24079eb8a2085f852eadd6a3c))
* update profile and update credentials UI ([#96](https://github.com/lakekeeper/console/issues/96)) ([ffc8b30](https://github.com/lakekeeper/console/commit/ffc8b3093f93128b068d631ca88f16e985e6d80e))

## [0.5.0](https://github.com/lakekeeper/console/compare/v0.4.0...v0.5.0) (2025-02-27)


### Features

* added s3 path sytle access option ([#81](https://github.com/lakekeeper/console/issues/81)) ([11abbcf](https://github.com/lakekeeper/console/commit/11abbcfa25a179b5bc57dfb9bb38d71a63095988))
* allow-alternative-protocols ([#87](https://github.com/lakekeeper/console/issues/87)) ([4c67bf7](https://github.com/lakekeeper/console/commit/4c67bf761e7a8c2d294221158917cd4a571c4587))
* update warehouse profile ([#88](https://github.com/lakekeeper/console/issues/88)) ([7cd090a](https://github.com/lakekeeper/console/commit/7cd090a76757a70085783403c47019577652f421))


### Bug Fixes

* **deps:** update dependency pinia-plugin-persistedstate-2 to v2.0.28 ([#68](https://github.com/lakekeeper/console/issues/68)) ([66dcf9f](https://github.com/lakekeeper/console/commit/66dcf9f49863ac88535105a7f58ded5df179a808))

## [0.4.0](https://github.com/lakekeeper/console/compare/v0.3.0...v0.4.0) (2025-01-07)


### Features

* copy user id from user table ([#77](https://github.com/lakekeeper/console/issues/77)) ([eacc396](https://github.com/lakekeeper/console/commit/eacc39688b191262cce0dca68bf3d1d2d2a8e0cc))
* warning banner auth is off and .env to manage enabledPermissions to overwrite  'authz-backend' ([#73](https://github.com/lakekeeper/console/issues/73)) ([ec73260](https://github.com/lakekeeper/console/commit/ec73260c3271d5f3155b9b0c17900814761fa841))


### Bug Fixes

* enable trino nested namespaces ([#76](https://github.com/lakekeeper/console/issues/76)) ([6a13bd2](https://github.com/lakekeeper/console/commit/6a13bd2b39dba7ecdae28043bad9c64434125fee))
* keep permission data on existing object by cancel ([#79](https://github.com/lakekeeper/console/issues/79)) ([de08068](https://github.com/lakekeeper/console/commit/de080681e1b6f21d1bad2d7654a6026a3723b63f))

## [0.3.0](https://github.com/lakekeeper/console/compare/v0.2.0...v0.3.0) (2024-12-17)


### Features

* Introduce VITE_ENABLE_PERMISSIONS, rename VITE_ENABLE_AUTHORIZATION ([#72](https://github.com/lakekeeper/console/issues/72)) ([a3af238](https://github.com/lakekeeper/console/commit/a3af238110dec9f27901a1a16c603003fc42c046))


### Bug Fixes

* aws key prefix is optional ([#65](https://github.com/lakekeeper/console/issues/65)) ([5683708](https://github.com/lakekeeper/console/commit/568370898e4580e6fb686dd40fd766a768c7026c))
* UI by enabled authentication and disabled authorization ([#70](https://github.com/lakekeeper/console/issues/70)) ([d29d453](https://github.com/lakekeeper/console/commit/d29d453370217ea4d2d55de26b3e35f8a67a4b6b))

## [0.2.0](https://github.com/lakekeeper/console/compare/v0.1.0...v0.2.0) (2024-12-12)


### Features

* Add azure key-prefix field ([#40](https://github.com/lakekeeper/console/issues/40)) ([a49f53d](https://github.com/lakekeeper/console/commit/a49f53d118d1f0aeda598449cf324e11845e4368))
* Add id search user or role ([#43](https://github.com/lakekeeper/console/issues/43)) ([68651b2](https://github.com/lakekeeper/console/commit/68651b224e2b3fa7c441584dabf4cc326bd353c3))
* Add load tab data ([#45](https://github.com/lakekeeper/console/issues/45)) ([edebbc7](https://github.com/lakekeeper/console/commit/edebbc735c2272d074451b1de0e944a1738e9e34))
* connect compute ([#60](https://github.com/lakekeeper/console/issues/60)) ([633c94c](https://github.com/lakekeeper/console/commit/633c94c6d0a4702095f3d4983bcfb7ee24b691ae))
* get token ([#51](https://github.com/lakekeeper/console/issues/51)) ([02b5176](https://github.com/lakekeeper/console/commit/02b5176ca7b09a749da43bfbeccd27e775542156))
* undrop tabulars ([#44](https://github.com/lakekeeper/console/issues/44)) ([b250595](https://github.com/lakekeeper/console/commit/b250595e7b23ed2d18442939f694ea7d0bc24cf1))


### Bug Fixes

* callback.vue user import ([#49](https://github.com/lakekeeper/console/issues/49)) ([f832aab](https://github.com/lakekeeper/console/commit/f832aab686aeb9180482e3d1dde55aac22a5c6f6))
* refresh tab after delete ([#47](https://github.com/lakekeeper/console/issues/47)) ([283644d](https://github.com/lakekeeper/console/commit/283644d11a66f284d7915ffa83a1f2dfa760b00f))
* rename-project ([#58](https://github.com/lakekeeper/console/issues/58)) ([15c7309](https://github.com/lakekeeper/console/commit/15c730976eccc666f1ef5344551d3ef937e47ebe))
* rust build location ([#38](https://github.com/lakekeeper/console/issues/38)) ([6d54659](https://github.com/lakekeeper/console/commit/6d5465997c17191ffe28e04b1653b4f4356da521))

## 0.1.0 (2024-12-06)


### Features

* added rename user , rename s3 flavor ([#34](https://github.com/lakekeeper/console/issues/34)) ([ebfb456](https://github.com/lakekeeper/console/commit/ebfb456f69e349a91e7be2672eaee5deab289b07))
* Authorization resources ([#26](https://github.com/lakekeeper/console/issues/26)) ([3f88cda](https://github.com/lakekeeper/console/commit/3f88cda4bc9d148de303af86f48232169ece19ea))
* Better S3 placeholders ([#35](https://github.com/lakekeeper/console/issues/35)) ([a023c9d](https://github.com/lakekeeper/console/commit/a023c9df46b64b71962e67ce794a8f25423cbcb7))
* embedded rust ([#15](https://github.com/lakekeeper/console/issues/15)) ([d7e9010](https://github.com/lakekeeper/console/commit/d7e901001dcf9a0a29554aaa2939fe772c9e3d5c))
* parse first and given names from name field in profile ([c925d1e](https://github.com/lakekeeper/console/commit/c925d1ee8076b3455f03a9d4eaf1413c5765be74))
* Use S3 logo for s3-compat storages ([#33](https://github.com/lakekeeper/console/issues/33)) ([de27d7d](https://github.com/lakekeeper/console/commit/de27d7d9301b264054a0a37cb6219af99d48268e))


### Bug Fixes

* **deps:** update dependency axios to v1.7.9 ([#4](https://github.com/lakekeeper/console/issues/4)) ([9dcb6bb](https://github.com/lakekeeper/console/commit/9dcb6bbab5075a12170bd42626d21e9d18824421))
* fixed gcs and az ([#20](https://github.com/lakekeeper/console/issues/20)) ([b573918](https://github.com/lakekeeper/console/commit/b57391818b64d638716b55ba53908caf216b8cbc))
* gcs key details and initial message on bootstrap ([#32](https://github.com/lakekeeper/console/issues/32)) ([6aaff01](https://github.com/lakekeeper/console/commit/6aaff010af427eb84ad11d268c97c86ea3407cf2))


### Miscellaneous Chores

* release 0.1.0 ([3b9c636](https://github.com/lakekeeper/console/commit/3b9c6363357f2c7d429f9c287d9e7145ce68ad81))

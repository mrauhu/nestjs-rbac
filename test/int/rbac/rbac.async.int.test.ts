import { INestApplication } from '@nestjs/common';
import { RBAcModule } from '../../../src/rbac.module';
import { RbacService } from '../../../src/services/rbac.service';
import { Test } from '@nestjs/testing';
import { ParamsFilter } from '../../../src/params-filter/params.filter';
import { AsyncService } from '../../fixtures/services/async.service';
import { RbacCache } from '../../../src/cache/rbac.cache';

jest.setTimeout(30000);

describe('RBAC async service', () => {
  let app: INestApplication;
  let rbacService: RbacService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule(
      {
        imports: [
          RBAcModule
            .useCache(RbacCache, {KEY: 'RBAC', TTL: 400})
            .forDynamic(AsyncService),
        ],
        controllers: [],
      },
    ).compile();

    app = moduleFixture.createNestApplication();
    rbacService = moduleFixture.get(RbacService);

    await app.init();
  });

  describe('Permission', () => {

    it('Should return true because admin has permissions for permission1@create',
      async () => {
        const res = await (await rbacService.getRole('admin')).can('permission1@create');
        expect(res).toBe(true);
      });

    it('Should return false because user hasn\'t permissions for permission1@update',
      async () => {
        const res = await (await rbacService.getRole('user')).can('permission1@update');
        expect(res).toBe(false);
      });

    it('Should return true because user has permissions for permission1@create',
      async () => {
        const res = await (await rbacService.getRole('user')).can('permission1@create');
        expect(res).toBe(true);
      });

  });

  describe('Extends', () => {

    it('Should return true because admin extends user',
      async () => {
        const res = await (await rbacService.getRole('admin')).can('permission2@update');
        expect(res).toBe(true);
      });

    it('Should return true because user extends userRoot',
      async () => {
        const res = await (await rbacService.getRole('user')).can('permission4@create');
        expect(res).toBe(true);
      });

    it('Should return false because deep extends dont work',
      async () => {
        const res = await (await rbacService.getRole('admin')).can('permission4@create');
        expect(res).toBe(false);
      });

  });

  describe('Filters', () => {

    it('Should return true because admin has the custom filter permission3@filter1',
      async () => {
        const filter = new ParamsFilter();
        filter.setParam('filter1', true);
        const res = await (await rbacService.getRole('admin', filter)).can(
          'permission3@filter1',
        );
        expect(res).toBe(true);
      });

    it('Should return false because admin has the custom filter ' +
      'permission3@filter1 permission3@filter1',
      async () => {
        const filter = new ParamsFilter();
        filter
          .setParam('filter1', true)
          .setParam('filter2', false);
        const res = await (await rbacService.getRole('admin', filter)).can(
          'permission3@filter2',
          'permission3@filter1',
        );
        expect(res).toBe(false);
      });

    it('Should return false because  of admin has the custom filter3 doesnt exist',
      async () => {
        const filter = new ParamsFilter();
        filter.setParam('filter1', true)
          .setParam('filter2', true)
          .setParam('filter3', true);

        const res = await (await rbacService.getRole('admin', filter)).can(
          'permission3@filter2',
          'permission3@filter1',
          'permission3@filter3',
        );

        expect(res).toBe(false);
      });

  });

  afterAll(async () => {
    await app.close();
  });
});

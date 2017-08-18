const {expect} = require('chai'),
  {aLernaProject, asBuilt, asGitCommited} = require('./utils'),
  index = require('..'),
  {join} = require('path'),
  {writeFileSync} = require('fs');

describe('detect-changes', () => {

  it('should not detect any changes for already marked modules', () => {
    const project = asBuilt(asGitCommited(aLernaProject()));

    return project.within(() => {
      const lernaPackages = index.loadPackages();
      lernaPackages.forEach(lernaPackage => expect(index.changes.isBuilt(lernaPackage)()).to.equal(true));
    });
  });

  it('should detect uncommitted modules as changed', () => {
    const project = aLernaProject();

    return project.within(() => {
      const lernaPackages = index.loadPackages();
      lernaPackages.forEach(lernaPackage => expect(index.changes.isBuilt(lernaPackage)()).to.equal(false));
    });
  });

  it('should detect change in module', () => {
    const project = asBuilt(asGitCommited(aLernaProject()));

    return project.within(() => {
      const aLernaPackage = index.loadPackages().pop();
      writeFileSync(join(aLernaPackage.location, 'some.txt'), 'qwe');

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(false);
    });
  });

  it('should respect .gitignore in root', () => {
    const projectWithGitIgnore = aLernaProject().inDir(ctx => {
      ctx.addFile('.gitignore', 'some.txt\n');
    });

    const project = asBuilt(asGitCommited(projectWithGitIgnore));

    return project.within(() => {
      const aLernaPackage = index.loadPackages().pop();
      writeFileSync(join(aLernaPackage.location, 'some.txt'), 'qwe');

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(true);
    });
  });

  it('should respect .gitignore in module dir', () => {
    const projectWithGitIgnore = aLernaProject().inDir(ctx => {
      ctx.addFile('nested/a/.gitignore', 'some.txt\n');
    });

    const project = asBuilt(asGitCommited(projectWithGitIgnore));

    return project.within(() => {
      const aLernaPackage = index.loadPackages().find(lernaPackage => lernaPackage.name === 'a');
      writeFileSync(join(aLernaPackage.location, 'some.txt'), 'qwe');

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(true);
    });
  });

  it('should should unbuild a module', () => {
    const project = asBuilt(asGitCommited(aLernaProject()));

    return project.within(() => {
      const aLernaPackage = index.loadPackages().pop();
      index.changes.unbuild(aLernaPackage)();

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(false);
    });
  });

  it('should respect label for makePackageBuilt', () => {
    const project = asBuilt(asGitCommited(aLernaProject()), 'woop');

    return project.within(() => {
      const lernaPackages = index.loadPackages();
      lernaPackages.forEach(lernaPackage => expect(index.changes.isBuilt(lernaPackage)()).to.equal(false));
      lernaPackages.forEach(lernaPackage => expect(index.changes.isBuilt(lernaPackage)('woop')).to.equal(true));
    });
  });

  it('should respect label for makePackageUnbuilt', () => {
    const project = asBuilt(asGitCommited(aLernaProject()), 'woop');

    return project.within(() => {
      const aLernaPackage = index.loadPackages().pop();
      index.changes.unbuild(aLernaPackage)();
      expect(index.changes.isBuilt(aLernaPackage)('woop')).to.equal(true);

      index.changes.unbuild(aLernaPackage)('woop');
      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(false);
    });
  });

});
/* globals beaker DatArchive confirm */

import * as yo from 'yo-yo'
import {EventEmitter} from 'events'

export class TemplateSelector extends EventEmitter {
  constructor (siteInfo) {
    super()
    this.el = null
    this.userTemplates = []
  }

  async setup () {
    this.userTemplates = await beaker.templates.list()
    this.rerender()
  }

  // rendering
  // =

  rerender () {
    if (this.el) {
      yo.update(this.el, this.render())
    }
  }

  render () {
    var el = yo`
      <div class="template-selector">
        <div class="template-selector-grid">
          ${this.renderTemplateItem('blank', 'Empty Project')}
          ${this.renderTemplateItem('website', 'Basic Website')}
          ${this.renderTemplateItem('website', 'Shared Files')}
          ${this.renderTemplateItem('website', 'Video')}
          ${this.renderTemplateItem('website', 'Music Album')}
          ${this.renderTemplateItem('website', 'Podcast')}
          ${this.renderTemplateItem('website', 'Document')}
          ${this.renderTemplateItem('website', 'Spreadsheet')}
          ${this.renderTemplateItem('website', 'Discussion Group')}
          ${this.renderTemplateItem('website', 'User List')}
          ${this.userTemplates.map(({url, title}) => this.renderTemplateItem(url, title, true))}
        </div>
      </div>`
    this.el = this.el || el
    return el
  }

  renderTemplateItem (url, title, isUserTemplate) {
    var screenshotUrl = isUserTemplate
      ? `beaker://templates/screenshot/${url}`
      : `beaker://assets/img/templates/${url}.png`
    return yo`
      <div
        class="template-item"
        onclick=${e => this.onSelectTemplate(e, url)}
        oncontextmenu=${e => this.onContextmenuTemplate(e, {url, title})}
      >
        <img src=${screenshotUrl} />
        <div class="label"><span>${title}</span></div>
      </div`
  }

  // event handlers
  // =

  async onSelectTemplate (e, template) {
    e.preventDefault()
    e.stopPropagation()

    if (template === 'blank') {
      template = false
    }

    // create the dat
    // TODO -- if using a dat template, need to decide whether to fork from dat:// or an internal snapshot -prf
    var archive
    if (template && template.startsWith('dat://')) {
      archive = await DatArchive.fork(template, {prompt: false})
    } else {
      archive = await DatArchive.create({template, prompt: false})
    }

    var redirectUrl = archive.url
    if (!template) {
      // for the blank template, go to the source view
      redirectUrl = `beaker://library/${archive.url}#setup`
    }
    this.emit('created', {archive, redirectUrl})
  }

  async onContextmenuTemplate (e, template) {
    e.preventDefault()
    e.stopPropagation()
    var {url} = template

    // TODO
    // select the template
    // this.selectedTemplate = url
    // this.rerender()

    // if (url !== 'blank' && url !== 'website') {
    //   // show the context menu
    //   const items = [
    //     { icon: 'trash', label: 'Delete template', click: () => this.onClickDeleteTemplate(template) }
    //   ]
    //   await contextMenu.create({x: e.clientX, y: e.clientY, items})
    // }
  }

  async onClickDeleteTemplate (template) {
    // confirm
    if (!confirm(`Remove ${template.title}?`)) {
      return
    }

    // remove
    await beaker.templates.remove(template.url)
    this.selectedTemplate = 'blank'
    this.setup()
  }

}

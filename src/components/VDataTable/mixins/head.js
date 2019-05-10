import { consoleWarn } from '../../../util/console'

import VCheckbox from '../../VCheckbox'
import VIcon from '../../VIcon'

/* @vue/component */
export default {
  props: {
    sortIcon: {
      type: String,
      default: '$vuetify.icons.sort'
    }
  },

  methods: {
    genTHead () {
      if (this.hideHeaders) return // Exit Early since no headers are needed.

      let children = []

      if (this.$scopedSlots.headers) {
        const row = this.$scopedSlots.headers({
          headers: this.headers,
          indeterminate: this.indeterminate,
          all: this.everyItem
        })

        children = [this.hasTag(row, 'th') ? this.genTR(row) : row, this.genTProgress()]
      } else {
        const row = this.headers.map((o, i) => this.genHeader(o, this.headerKey ? o[this.headerKey] : i, i))

        // render select all here only when selectAll is enabled AND the table contains no fixed columns,
        // otherwise genHeader() takes care of it
        this.hasSelectAll && !this.getFixedColumnLeft() && row.unshift(this.genSelectAllHeader())

        children = [this.genTR(row), this.genTProgress()]
      }
      // fixed column isn't compatible with the built in progress bar
      this.getFixedColumnLeft() && children.pop()
      return this.$createElement('thead', [children])
    },
    genSelectAllHeader (data = {}) {
      const checkbox = this.$createElement(VCheckbox, {
        props: {
          dark: this.dark,
          light: this.light,
          color: this.selectAll === true ? '' : this.selectAll,
          hideDetails: true,
          inputValue: this.everyItem,
          indeterminate: this.indeterminate
        },
        on: { change: this.toggle }
      })
      return this.$createElement('th', data, [checkbox])
    },
    genHeader (header, key, indx) {
      if (this.hasSelectAll && header.fixed === true && indx === 0) {
        return this.genSelectAllHeader({
          class: 'fixed-column',
          attrs: { width: header.width || null },
          style: { left: `${this.getFixedColumnLeft(indx)}px` }
        })
      }

      const array = [
        this.$scopedSlots.headerCell
          ? this.$scopedSlots.headerCell({ header })
          : header[this.headerText]
      ]

      return this.$createElement('th', ...this.genHeaderData(header, array, key, indx))
    },
    getFixedColumnLeft (indx = this.headers.length) {
      return this.headers
        .filter((header, i) => i < indx && header.fixed === true)
        .reduce((currentValue, header) => currentValue + (parseInt(header.width) || 0), 0)
    },
    genHeaderData (header, children, key, indx) {
      const classes = ['column']
      const data = {
        key,
        attrs: {
          role: 'columnheader',
          scope: 'col',
          width: header.width || null,
          'aria-label': header[this.headerText] || '',
          'aria-sort': 'none'
        }
      }

      if (header.sortable == null || header.sortable) {
        this.genHeaderSortingData(header, children, data, classes)
      } else {
        data.attrs['aria-label'] += ': Not sorted.' // TODO: Localization
      }

      if (header.fixed === true) {
        classes.push('fixed-column')
        if (this.headers[indx + 1] && !this.headers[indx + 1].fixed) {
          classes.push('last-fixed-column')
        }
        data.style = { left: `${this.getFixedColumnLeft(indx)}px` }
      }
      classes.push(`text-xs-${header.align || 'left'}`)
      if (Array.isArray(header.class)) {
        classes.push(...header.class)
      } else if (header.class) {
        classes.push(header.class)
      }
      data.class = classes

      return [data, children]
    },
    genHeaderSortingData (header, children, data, classes) {
      if (!('value' in header)) {
        consoleWarn('Headers must have a value property that corresponds to a value in the v-model array', this)
      }

      data.attrs.tabIndex = 0
      data.on = {
        click: () => {
          this.expanded = {}
          this.sort(header.value)
        },
        keydown: e => {
          // check for space
          if (e.keyCode === 32) {
            e.preventDefault()
            this.sort(header.value)
          }
        }
      }

      classes.push('sortable')
      const icon = this.$createElement(VIcon, {
        props: {
          small: true
        }
      }, this.sortIcon)
      if (!header.align || header.align === 'left') {
        children.push(icon)
      } else {
        children.unshift(icon)
      }

      const pagination = this.computedPagination
      const beingSorted = pagination.sortBy === header.value
      if (beingSorted) {
        classes.push('active')
        if (pagination.descending) {
          classes.push('desc')
          data.attrs['aria-sort'] = 'descending'
          data.attrs['aria-label'] += ': Sorted descending. Activate to remove sorting.' // TODO: Localization
        } else {
          classes.push('asc')
          data.attrs['aria-sort'] = 'ascending'
          data.attrs['aria-label'] += ': Sorted ascending. Activate to sort descending.' // TODO: Localization
        }
      } else {
        data.attrs['aria-label'] += ': Not sorted. Activate to sort ascending.' // TODO: Localization
      }
    }
  }
}

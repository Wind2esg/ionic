import React from 'react';
import ReactDom from 'react-dom';

import { NavContext } from '../contexts/NavContext';

import { ReactProps } from './ReactProps';
import { RouterDirection } from './hrefprops';
import { attachEventProps, createForwardRef, dashToPascalCase, isCoveredByReact } from './utils';

interface IonicReactInternalProps<ElementType> extends React.HTMLAttributes<ElementType> {
  forwardedRef?: React.Ref<ElementType>;
  href?: string;
  ref?: React.Ref<any>;
  routerDirection?: RouterDirection;
}

export const createReactComponent = <PropType, ElementType>(
  tagName: string,
  hrefComponent = false
) => {
  const displayName = dashToPascalCase(tagName);
  const ReactComponent = class extends React.Component<IonicReactInternalProps<PropType>> {
    context!: React.ContextType<typeof NavContext>;

    constructor(props: IonicReactInternalProps<PropType>) {
      super(props);
    }

    componentDidMount() {
      this.componentDidUpdate(this.props);
    }

    componentDidUpdate(prevProps: IonicReactInternalProps<PropType>) {
      const node = ReactDom.findDOMNode(this) as HTMLElement;
      attachEventProps(node, this.props, prevProps);
    }

    private handleClick = (e: MouseEvent) => {
      // TODO: review target usage
      const { href, routerDirection } = this.props;
      if (href !== undefined && this.context.hasIonicRouter()) {
        e.preventDefault();
        this.context.navigate(href, routerDirection);
      }
    }

    render() {
      const { children, forwardedRef, style, className, ref, ...cProps } = this.props;

      const propsToPass = Object.keys(cProps).reduce((acc, name) => {
        if (name.indexOf('on') === 0 && name[2] === name[2].toUpperCase()) {
          const eventName = name.substring(2).toLowerCase();
          if (isCoveredByReact(eventName)) {
            (acc as any)[name] = (cProps as any)[name];
          }
        }
        return acc;
      }, {});

      const newProps: any = {
        ...propsToPass,
        ref: forwardedRef,
        style
      };

      if (hrefComponent) {
        if (newProps.onClick) {
          const oldClick = newProps.onClick;
          newProps.onClick = (e: MouseEvent) => {
            oldClick(e);
            if (!e.defaultPrevented) {
              this.handleClick(e);
            }
          };
        } else {
          newProps.onClick = this.handleClick;
        }
      }

      return React.createElement(
        tagName,
        newProps,
        children
      );
    }

    static get displayName() {
      return displayName;
    }

    static get contextType() {
      return NavContext;
    }
  };
  return createForwardRef<PropType & ReactProps, ElementType>(ReactComponent, displayName);
};

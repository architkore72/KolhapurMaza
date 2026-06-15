import { Node, mergeAttributes } from '@tiptap/core';

export const Youtube = Node.create({
  name: 'youtube',
  group: 'block',
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      videoId: { default: null },
      width: { default: '100%' },
      height: { default: '400' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-video]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { videoId, width, height } = HTMLAttributes;
    return [
      'div',
      mergeAttributes({ 'data-youtube-video': '', style: 'position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 8px;' }),
      [
        'iframe',
        {
          src: `https://www.youtube.com/embed/${videoId}`,
          width,
          height,
          frameborder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
          style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setYoutube: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

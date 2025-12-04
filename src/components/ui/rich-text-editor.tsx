"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import CodeBlock from '@tiptap/extension-code-block';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  CheckSquare,
  Type,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Code2,
  Trash2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const FONT_FAMILIES = [
  'Inter',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Comic Sans MS',
  'Trebuchet MS',
  'Impact',
];

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC',
  '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF', '#980000', '#FF0000',
  '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF',
  '#9900FF', '#FF00FF', '#FF6E6E', '#FFCC99', '#FFFF99', '#B1FF99',
  '#99FFFF', '#99CCFF', '#CC99FF', '#FF99CC', '#EA9999', '#F9CB9C',
  '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#B4A7D6', '#D5A6BD',
];

const HIGHLIGHT_COLORS = [
  '#FFFF00', '#FFCC99', '#FF99CC', '#CC99FF', '#99CCFF', '#99FFFF',
  '#B1FF99', '#FFE599', '#F9CB9C', '#EA9999', '#D5A6BD', '#B4A7D6',
  '#A4C2F4', '#A2C4C9', '#B6D7A8', '#FF6E6E',
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing...",
  className = "",
}) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: false, // We'll use the separate CodeBlock extension
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Subscript,
      Superscript,
      Highlight.configure({
        multicolor: true,
      }),
      CodeBlock.configure({
        languageClassPrefix: 'language-',
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border',
        },
      }),
      TableRow,
      TableHeader,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border px-4 py-2',
        },
      }),
      HorizontalRule,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      FontFamily,
      TextStyle,
      Color,
      Dropcursor,
      Gapcursor,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[300px] px-4 py-3 prose prose-sm max-w-none',
      },
    },
    immediatelyRender: false,
  });

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setShowLinkDialog(true);
  }, [editor]);

  const insertLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setShowLinkDialog(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;

    editor.chain().focus().setImage({ src: imageUrl }).run();
    setShowImageDialog(false);
    setImageUrl('');
  }, [editor, imageUrl]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addColumnBefore = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addColumnBefore().run();
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteColumn = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteColumn().run();
  }, [editor]);

  const addRowBefore = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addRowBefore().run();
  }, [editor]);

  const addRowAfter = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const deleteRow = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteRow().run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
  }, [editor]);

  const setColor = useCallback((color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
  }, [editor]);

  const setHighlight = useCallback((color: string) => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight({ color }).run();
  }, [editor]);

  const setFontFamily = useCallback((font: string) => {
    if (!editor) return;
    editor.chain().focus().setFontFamily(font).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-lg overflow-hidden bg-background ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2 flex flex-wrap items-center gap-1 max-h-[200px] overflow-y-auto">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'bg-muted' : ''}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-muted' : ''}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'bg-muted' : ''}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        {/* Subscript/Superscript */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={editor.isActive('subscript') ? 'bg-muted' : ''}
            title="Subscript"
          >
            <SubscriptIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={editor.isActive('superscript') ? 'bg-muted' : ''}
            title="Superscript"
          >
            <SuperscriptIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={editor.isActive('heading') ? 'bg-muted' : ''}
                title="Headings"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
                >
                  <Heading1 className="h-4 w-4 mr-2" />
                  Heading 1
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
                >
                  <Heading2 className="h-4 w-4 mr-2" />
                  Heading 2
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
                >
                  <Heading3 className="h-4 w-4 mr-2" />
                  Heading 3
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                  className={editor.isActive('heading', { level: 4 }) ? 'bg-muted' : ''}
                >
                  <Heading4 className="h-4 w-4 mr-2" />
                  Heading 4
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                  className={editor.isActive('heading', { level: 5 }) ? 'bg-muted' : ''}
                >
                  <Heading5 className="h-4 w-4 mr-2" />
                  Heading 5
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                  className={editor.isActive('heading', { level: 6 }) ? 'bg-muted' : ''}
                >
                  <Heading6 className="h-4 w-4 mr-2" />
                  Heading 6
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().setParagraph().run()}
                  className={editor.isActive('paragraph') ? 'bg-muted' : ''}
                >
                  Paragraph
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={editor.isActive({ textAlign: 'justify' }) ? 'bg-muted' : ''}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={editor.isActive('taskList') ? 'bg-muted' : ''}
            title="Task List"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>

        {/* Blockquote & Code Block */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-muted' : ''}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
            title="Code Block"
          >
            <Code2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Text Color"
              >
                <Type className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <Label className="text-sm mb-2 block">Text Color</Label>
              <div className="grid grid-cols-8 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Highlight Color"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <Label className="text-sm mb-2 block">Highlight Color</Label>
              <div className="grid grid-cols-8 gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setHighlight(color)}
                    title={color}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Font Family */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Font Family"
              >
                <Type className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="flex flex-col gap-1">
                {FONT_FAMILIES.map((font) => (
                  <Button
                    key={font}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFontFamily(font)}
                    style={{ fontFamily: font }}
                    className="justify-start"
                  >
                    {font}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Insert Elements */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={setLink}
                className={editor.isActive('link') ? 'bg-muted' : ''}
                title="Insert Link"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-3">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      insertLink();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button onClick={insertLink} size="sm" className="flex-1">
                    {linkUrl ? 'Update' : 'Remove'} Link
                  </Button>
                  <Button onClick={() => setShowLinkDialog(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover open={showImageDialog} onOpenChange={setShowImageDialog}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowImageDialog(true)}
                title="Insert Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-3">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      insertImage();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button onClick={insertImage} size="sm" className="flex-1" disabled={!imageUrl}>
                    Insert Image
                  </Button>
                  <Button onClick={() => setShowImageDialog(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={editor.isActive('table') ? 'bg-muted' : ''}
                title="Table"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertTable}
                  className="w-full justify-start"
                >
                  Insert Table
                </Button>
                {editor.isActive('table') && (
                  <>
                    <div className="border-t my-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addColumnBefore}
                      className="w-full justify-start"
                    >
                      Add Column Before
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addColumnAfter}
                      className="w-full justify-start"
                    >
                      Add Column After
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={deleteColumn}
                      className="w-full justify-start"
                    >
                      Delete Column
                    </Button>
                    <div className="border-t my-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addRowBefore}
                      className="w-full justify-start"
                    >
                      Add Row Before
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addRowAfter}
                      className="w-full justify-start"
                    >
                      Add Row After
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={deleteRow}
                      className="w-full justify-start"
                    >
                      Delete Row
                    </Button>
                    <div className="border-t my-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={deleteTable}
                      className="w-full justify-start text-destructive"
                    >
                      Delete Table
                    </Button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Insert Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            title="Clear Formatting"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="bg-background min-h-[300px]">
        <EditorContent 
          editor={editor}
          className="[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h4]:text-lg [&_.ProseMirror_h4]:font-bold [&_.ProseMirror_h4]:mb-2 [&_.ProseMirror_h5]:text-base [&_.ProseMirror_h5]:font-bold [&_.ProseMirror_h5]:mb-2 [&_.ProseMirror_h6]:text-sm [&_.ProseMirror_h6]:font-bold [&_.ProseMirror_h6]:mb-2 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-muted [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-sm [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded [&_.ProseMirror_pre]:my-4 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic [&_.ProseMirror_u]:underline [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:my-4 [&_.ProseMirror_table_td]:border [&_.ProseMirror_table_td]:border-border [&_.ProseMirror_table_td]:px-4 [&_.ProseMirror_table_td]:py-2 [&_.ProseMirror_table_th]:border [&_.ProseMirror_table_th]:border-border [&_.ProseMirror_table_th]:px-4 [&_.ProseMirror_table_th]:py-2 [&_.ProseMirror_table_th]:bg-muted [&_.ProseMirror_table_th]:font-bold [&_.ProseMirror_hr]:border-t [&_.ProseMirror_hr]:border-border [&_.ProseMirror_hr]:my-4 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded [&_.ProseMirror_img]:my-4"
        />
      </div>
    </div>
  );
};

export default RichTextEditor;

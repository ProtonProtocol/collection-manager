import {
  useState,
  forwardRef,
  useEffect,
  useCallback,
  Ref,
  InputHTMLAttributes,
} from 'react';
import Image from 'next/image';
import { UploadSimple, File, FileCsv, FilePdf, FileX } from 'phosphor-react';
import { ipfsEndpoint } from '@configs/globalsConfig';
import { convertToBase64 } from '@utils/convertToBase64';

import { Loading } from '@components/Loading';

interface InputPreviewComponentProps
  extends InputHTMLAttributes<HTMLInputElement> {
  title?: string;
  description?: string;
  ipfsHash?: string;
  error?: string;
  onChange: (prop: any) => void;
  accept?: string;
}

function InputPreviewComponent(
  {
    onChange,
    title,
    description,
    ipfsHash,
    error,
    accept,
    ...props
  }: InputPreviewComponentProps,
  ref: Ref<HTMLInputElement | any>
) {
  const [previewSrc, setPreviewSrc] = useState(null);
  const [isIpfs, setIsIpfs] = useState(true);
  const [waitToSearch, setWaitToSearch] = useState(null);
  const [messageError, setMessageError] = useState(error);

  function handleOnChangeFile(event) {
    onChange(event);
    setPreviewSrc('');

    const files = event.target.files;

    if (files.length > 0) {
      const [file] = files;
      const fileReader = new FileReader();

      fileReader.onload = () => {
        setPreviewSrc(fileReader.result);
      };

      fileReader.readAsDataURL(file);
    } else {
      setPreviewSrc(null);
    }
  }

  function handleOnChangeIpfs(event) {
    onChange(event);
    setPreviewSrc('');

    const { value } = event.target;
    if (!value) {
      setPreviewSrc(null);
      return;
    }

    clearTimeout(waitToSearch);

    const newWaitToSearch = setTimeout(() => {
      handleIpfsPreview(value);
    }, 500);

    setWaitToSearch(newWaitToSearch);
  }

  function handleToggleIpfs() {
    setIsIpfs((state) => !state);
    setPreviewSrc(null);
  }

  const handleIpfsPreview = useCallback(
    async (ipfs) => {
      setMessageError('');

      const result = await fetch(`${ipfsEndpoint}/${ipfs}`);
      const data = await result.blob();
      const preview = (await convertToBase64(data)) as string;

      if (accept) {
        const [acceptType] = accept.split('/');
        const previewType = preview.replace(/^data:([^/]+).*/, '$1');

        if (acceptType !== previewType) {
          setMessageError('Invalid IPFS hash');
          setPreviewSrc(null);
          return;
        }
      }

      setPreviewSrc(preview);
    },
    [accept]
  );

  useEffect(() => {
    if (!!ipfsHash) {
      handleIpfsPreview(ipfsHash);
    }
  }, [handleIpfsPreview, ipfsHash]);

  return (
    <div className="w-full">
      <label
        className={`block aspect-video rounded cursor-pointer p-4 bg-neutral-800 border ${
          messageError ? 'border-red-600' : 'border-neutral-700'
        }`}
      >
        {/image/.test(previewSrc) ? (
          <div className="relative w-full h-full">
            <Image src={previewSrc} fill className="object-contain" alt="" />
          </div>
        ) : /video\/mp4/.test(previewSrc) || /video\/webm/.test(previewSrc) ? (
          <video
            muted
            autoPlay
            loop
            playsInline
            className="w-full h-full object-contain"
          >
            <source src={previewSrc} type="video/mp4" />
          </video>
        ) : /text\/csv/.test(previewSrc) ? (
          <div className="w-full h-full flex justify-center items-center">
            <FileCsv size={56} />
          </div>
        ) : /application\/pdf/.test(previewSrc) ? (
          <div className="w-full h-full flex justify-center items-center">
            <FilePdf size={56} />
          </div>
        ) : previewSrc ? (
          <div className="w-full h-full flex justify-center items-center">
            <File size={56} />
          </div>
        ) : previewSrc === '' ? (
          <div className="flex h-full items-center">
            <Loading />
          </div>
        ) : messageError ? (
          <div className="w-full h-full flex flex-col justify-center items-center gap-2 text-center text-red-600">
            <FileX size={56} />
            <p className="title-1">{messageError}</p>
          </div>
        ) : (
          <div
            className="w-full h-full flex flex-col justify-center items-center gap-2 text-center"
            onClick={handleToggleIpfs}
          >
            <UploadSimple size={56} />
            {title && <p className="title-1">{title}</p>}
            {description && <p className="body-3">{description}</p>}
          </div>
        )}
        <div
          className={`flex gap-4 items-center border-t pt-4 ${
            messageError ? 'border-red-600' : 'border-neutral-700'
          }`}
        >
          <div className="flex-1">
            {isIpfs ? (
              <input
                {...props}
                ref={ref}
                type="text"
                placeholder="IPFS hash"
                onChange={handleOnChangeIpfs}
                className="w-full body-1 text-white bg-transparent focus:outline-none placeholder:text-neutral-500"
              />
            ) : (
              <input
                {...props}
                ref={ref}
                type="file"
                accept={accept}
                onChange={handleOnChangeFile}
                className="w-full file:hidden"
              />
            )}
          </div>
          <div className="flex-none">
            <button
              type="button"
              className="btn btn-small"
              onClick={handleToggleIpfs}
            >
              {isIpfs ? 'Upload' : 'IPFS hash'}
            </button>
          </div>
        </div>
      </label>
    </div>
  );
}

export const InputPreview = forwardRef(InputPreviewComponent);

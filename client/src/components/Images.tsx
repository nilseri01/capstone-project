import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Form,
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'
import { Link, Route, Router, Switch } from 'react-router-dom'

import { createImage, deleteImage, getImages, getUploadUrl, uploadFile, getImagesES } from '../api/images-api'
import Auth from '../auth/Auth'
import { ImageItem } from '../types/ImageItem'
import { threadId } from 'worker_threads'

enum UploadState {
  NoUpload,
  UploadingFile
}

interface ImagesProps {
  auth: Auth
  history: History
}

interface ImagesState {
  images: ImageItem[]
  loadingImages: boolean
  file: any
  name: string
  watermark: string
  uploadState: UploadState,
  searchKey: string
}

export class Images extends React.PureComponent<ImagesProps, ImagesState> {
  state: ImagesState = {
    images: [],
    loadingImages: true,
    file: undefined,
    name: '',
    watermark: '',
    uploadState: UploadState.NoUpload,
    searchKey: ''
  }

  fileInputRef: React.RefObject<HTMLInputElement>

  constructor(props: ImagesProps, state: ImagesState) {
    super(props, state)
    this.fileInputRef = React.createRef()
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ name: event.target.value })
  }

  handleWatermarkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ watermark: event.target.value })
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    this.setState({
      file: files[0],
      name: files[0].name
    })
  }

  handleSearchKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchKey: event.target.value })
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      if (!this.state.file) {
        alert('File should be selected')
        return
      }

      if (!this.state.watermark || this.state.watermark.length === 0) {
        alert('Watermark text should not be empty')
        return
      }

      const newImage = await createImage(this.props.auth.getIdToken(), {
        name: this.state.name,
        watermark: this.state.watermark
      })

      const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), newImage.id, newImage.watermark);

      this.setUploadState(UploadState.UploadingFile)
      await uploadFile(uploadUrl, this.state.file)

      this.setState({
        images: [...this.state.images, newImage],
        name: '',
        watermark: '',
        file: undefined
      })

      if (this.fileInputRef.current != null) {
        this.fileInputRef.current.value = ''
      }
    } catch {
      alert('Image item creation failed')
    } finally {
      this.setUploadState(UploadState.NoUpload)
    }
  }

  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
  }

  onImageDelete = async (imageId: string) => {
    try {
      await deleteImage(this.props.auth.getIdToken(), imageId)
      this.setState({
        images: this.state.images.filter(image => image.id != imageId)
      })
    } catch {
      alert('Image item deletion failed')
    }
  }

  async componentDidMount() {
    this.loadAllImages()
  }

  async loadAllImages() {
    try {
      const images = await getImages(this.props.auth.getIdToken())
      this.setState({
        images,
        loadingImages: false
      })
    } catch (e) {
      alert(`Failed to fetch images: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Search Images (with ElasticSearch)</Header>
        <Form onSubmit={this.handleSearch}>
          {this.renderSearch()}
        </Form>

        <Header as="h1">Upload new image</Header>
        <Form onSubmit={this.handleSubmit}>
          {this.renderUploadImage()}
        </Form>

        <Header as="h1">Images</Header>
        {this.renderImages()}
      </div>
    )
  }

  handleAllImages = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    this.loadAllImages()
  }

  handleSearch = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      if (!this.state.searchKey || this.state.searchKey.length === 0) {
        alert('Search text should not be empty')
        return
      }

      this.state.images = await getImagesES(this.props.auth.getIdToken(), this.state.searchKey)

      this.setState({
        searchKey: ''
      })
    } catch {
      alert('Search failed')
    }
  }

  renderSearch() {
    return (
      <div>
        <Form.Field>
          <label>Search Text</label>
          <input
            maxLength={30}
            value={this.state.searchKey}
            placeholder="Search..."
            onChange={this.handleSearchKeyChange}
          />
        </Form.Field>
        <Button
          type="submit"
        >
          Search
        </Button>
        <Button
          onClick={this.handleAllImages}
        >
          Load All
      </Button>
      </div>
    )
  }

  renderUploadImage() {
    return (
      <div>
        <Form.Field>
          <label>File</label>
          <input
            type="file"
            accept="image/*"
            ref={this.fileInputRef}
            placeholder="Image to upload"
            onChange={this.handleFileChange}
          />
        </Form.Field>
        <Form.Field>
          <input
            hidden
            value={this.state.name}
            onChange={this.handleNameChange}
          />
        </Form.Field>
        <Form.Field>
          <label>Watermark Text</label>
          <input
            maxLength={30}
            value={this.state.watermark}
            placeholder="watermark..."
            onChange={this.handleWatermarkChange}
          />
        </Form.Field>
        {this.renderCreateImageButton()}
      </div>
    )
  }

  renderCreateImageButton() {
    return (
      <div>
        {this.state.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
        <Button
          loading={this.state.uploadState !== UploadState.NoUpload}
          type="submit"
        >
          Save
        </Button>
      </div>
    )
  }

  renderImages() {
    if (this.state.loadingImages) {
      return this.renderLoading()
    }

    return this.renderImageList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading Images
        </Loader>
      </Grid.Row>
    )
  }

  renderImageList() {
    return (
      <Grid padded>
        {this.state.images.map((image, pos) => {
          return (
            <Grid.Row key={image.id}>
              <Grid.Column width={10} verticalAlign="middle">
                <p>Name: <a href={image.uploadUrl} target="_blank">{image.name}</a></p>
                <p>Watermark: {image.watermark}</p>
                <p>CreatedDate: {this.formatDate(image.createdDate)}</p>
                <p>Processed: {String(image.processed)}</p>
                <p>ProcessDate: {this.formatDate(image.processDate)}</p>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onImageDelete(image.id)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {image.uploadUrl && (
                <Image src={image.uploadUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  formatDate(date: string): string {
    if (!date || date.length === 0) {
      return date
    }
    return dateFormat(date, 'dd-mm-yyyy hh:MM:ss') as string
  }
}
